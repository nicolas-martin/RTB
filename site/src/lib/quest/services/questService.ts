import type { Quest, QuestProgress, ProjectMetadata } from '../types/quest';
import { questParser } from './questParser';
import { GraphQLService } from './graphqlClient';
import { BaseQuest } from '../models';
import { resolveVariableFunction } from './variableFunctions';
import { QuestDatabaseService, getQuestDatabaseService } from '../database/questDatabaseService';
import type { QuestCompletion } from '../database/types';

export class QuestService {
	private project: ProjectMetadata | null = null;
	private quests: BaseQuest[] = [];
	private questProgress: Map<string, QuestProgress> = new Map();
	private graphqlService: GraphQLService;
	private databaseService: QuestDatabaseService;

	constructor(graphqlEndpoint?: string, databaseService?: QuestDatabaseService) {
		this.graphqlService = new GraphQLService(graphqlEndpoint || '');
		this.databaseService = databaseService || getQuestDatabaseService();
	}

	async loadProject(tomlContent: string): Promise<void> {
		try {
			const { project, quests } =
				await questParser.parseProjectFromFile(tomlContent);
			this.project = project;
			this.quests = quests;
			this.graphqlService.updateEndpoint(project.graphqlEndpoint);
		} catch (error) {
			console.error('Failed to load project:', error);
			throw error;
		}
	}

	getProject(): ProjectMetadata | null {
		return this.project;
	}

	async checkQuest(
		questId: string,
		playerId: string,
		existingCompletion?: QuestCompletion
	): Promise<Quest | null> {
		const quest = this.quests.find((q) => q.getId() === questId);
		if (!quest) {
			console.error(`Quest not found: ${questId}`);
			return null;
		}

		if (!this.project) {
			console.error('Project not loaded');
			return null;
		}

		try {
			const projectId = this.project.id;
			let completionRecord = existingCompletion;

			// If we do not have pre-fetched data, fall back to single quest lookup
			if (!completionRecord) {
				const isCompleted = await this.databaseService.isQuestCompleted(
					playerId,
					questId,
					projectId
				);

				if (isCompleted) {
					completionRecord = {
						userAddress: playerId,
						questId,
						projectId,
						completed: true,
						lastCheckedAt: new Date().toISOString(),
					};
				}
			}

			if (completionRecord?.completed) {
				console.log(`[QuestService] Quest ${questId} already completed for user ${playerId}`);

				// Return completed quest without running validation
				const progress: QuestProgress = {
					questId,
					completed: true,
					progress: completionRecord.progress,
					lastUpdated: completionRecord.lastCheckedAt ?? new Date().toISOString(),
				};

				this.questProgress.set(questId, progress);

				return {
					...quest.getConfig(),
					completed: true,
					progress: undefined,
				};
			}

			// Seed local progress with any partial data from the database before validation
			if (completionRecord && completionRecord.progress !== undefined) {
				this.questProgress.set(questId, {
					questId,
					completed: false,
					progress: completionRecord.progress,
					lastUpdated: completionRecord.lastCheckedAt ?? new Date().toISOString(),
				});
			}

			// Quest not completed, run validation
			const variables = await this.buildQueryVariables(quest.getQuery(), playerId, quest.getConfig());

			const queryResult = await this.graphqlService.executeQuery(
				quest.getQuery(),
				variables
			);

			const validation = await quest.validate(queryResult);

			const progress: QuestProgress = {
				questId,
				completed: validation.completed,
				progress: validation.progress,
				lastUpdated: new Date().toISOString(),
			};

			this.questProgress.set(questId, progress);

			// If quest just completed, mark it in database
			if (validation.completed) {
				const marked = await this.databaseService.markQuestCompleted(
					playerId,
					questId,
					this.project.id,
					quest.getReward()
				);
				if (marked) {
					console.log(`[QuestService] Quest ${questId} marked as completed. Points awarded: ${quest.getReward()}`);
				} else {
					console.warn(`[QuestService] Quest ${questId} was already completed in database`);
				}
			}

			return {
				...quest.getConfig(),
				completed: validation.completed,
				progress: validation.progress,
			};
		} catch (error) {
			console.error(`Failed to check quest ${questId}:`, error);

				// On database error, continue with direct validation only
			if (error instanceof Error && error.message.includes('database')) {
				console.warn('[QuestService] Database error, falling back to local validation');
				// Continue with normal validation flow
				try {
					const variables = await this.buildQueryVariables(quest.getQuery(), playerId, quest.getConfig());
					const queryResult = await this.graphqlService.executeQuery(quest.getQuery(), variables);
					const validation = await quest.validate(queryResult);

					const progress: QuestProgress = {
						questId,
						completed: validation.completed,
						progress: validation.progress,
						lastUpdated: new Date().toISOString(),
					};

					this.questProgress.set(questId, progress);

					return {
						...quest.getConfig(),
						completed: validation.completed,
						progress: validation.progress,
					};
				} catch (fallbackError) {
					console.error(`Fallback validation failed for quest ${questId}:`, fallbackError);
					return null;
				}
			}

			return null;
		}
	}

	async checkAllQuests(playerId: string): Promise<Quest[]> {
		const results: Quest[] = [];
		let completionMap: Map<string, QuestCompletion> | undefined;

		if (this.project) {
			try {
				const completions = await this.databaseService.getUserQuestCompletions(
					playerId,
					this.project.id
				);
				completionMap = new Map(
					completions.map((completion) => [completion.questId, completion])
				);
			} catch (error) {
				console.error(
					`[QuestService] Failed to preload quest completions for project ${this.project.id}:`,
					error
				);
			}
		}

		for (const quest of this.quests) {
			const completionRecord = completionMap?.get(quest.getId());
			const result = await this.checkQuest(quest.getId(), playerId, completionRecord);
			if (result) {
				results.push(result);
			}
		}

		return results;
	}

	getQuests(): BaseQuest[] {
		return this.quests;
	}

	getQuestsWithProgress(): Quest[] {
		return this.quests.map((quest) => {
			const progress = this.questProgress.get(quest.getId());
			return {
				...quest.getConfig(),
				completed: progress?.completed ?? false,
				progress: progress?.progress,
			};
		});
	}

	getQuestById(questId: string): Quest | null {
		const quest = this.quests.find((q) => q.getId() === questId);
		if (!quest) return null;

		const progress = this.questProgress.get(questId);
		return {
			...quest.getConfig(),
			completed: progress?.completed ?? false,
			progress: progress?.progress,
		};
	}

	getActiveQuests(): Quest[] {
		const now = new Date();
		return this.getQuestsWithProgress().filter((quest) => {
			if (!quest.startDate && !quest.endDate) return true;

			const start = quest.startDate ? new Date(quest.startDate) : null;
			const end = quest.endDate ? new Date(quest.endDate) : null;

			if (start && now < start) return false;
			if (end && now > end) return false;

			return true;
		});
	}

	getCompletedQuests(): Quest[] {
		return this.getQuestsWithProgress().filter((quest) => quest.completed);
	}

	getIncompleteQuests(): Quest[] {
		return this.getQuestsWithProgress().filter((quest) => !quest.completed);
	}

	updateGraphQLEndpoint(endpoint: string): void {
		this.graphqlService.updateEndpoint(endpoint);
	}

	clearProgress(): void {
		if (!this.project) return;

		this.questProgress.clear();
	}

	async getUserPoints(playerId: string): Promise<number> {
		if (!this.project) return 0;

		try {
			return await this.databaseService.getUserPoints(playerId, this.project.id);
		} catch (error) {
			console.error('[QuestService] Failed to get user points:', error);
			return 0;
		}
	}

	async getCompletedQuestsFromDb(playerId: string): Promise<string[]> {
		if (!this.project) return [];

		try {
			const completions = await this.databaseService.getUserCompletedQuests(playerId, this.project.id);
			return completions.map(c => c.questId);
		} catch (error) {
			console.error('[QuestService] Failed to get completed quests:', error);
			return [];
		}
	}

	setDatabaseService(service: QuestDatabaseService): void {
		this.databaseService = service;
	}

	private async buildQueryVariables(query: string, playerId: string, questConfig: any): Promise<Record<string, any>> {
		const variables: Record<string, any> = {};

		// Extract all variable definitions from the query
		const variableRegex = /\$(\w+):\s*\w+[!]?/g;
		let match;

		while ((match = variableRegex.exec(query)) !== null) {
			const variableName = match[1];
			// Map all variables to playerId for now
			// In the future, we can extend this to handle other variable types
			variables[variableName] = playerId;
		}

		// Process quest-specific variables from the variables section
		if (questConfig.variables && Array.isArray(questConfig.variables)) {
			for (const variableObj of questConfig.variables) {
				for (const [varName, varValue] of Object.entries(variableObj)) {
					// If it looks like a function name (starts with lowercase letter), resolve it
					if (typeof varValue === 'string' && /^[a-z][a-zA-Z0-9]*$/.test(varValue)) {
						variables[varName] = await resolveVariableFunction(varValue, this.project?.id || '');
					} else {
						// Static value
						variables[varName] = varValue;
					}
				}
			}
		}

		return variables;
	}
}

export const createQuestService = (graphqlEndpoint?: string) =>
	new QuestService(graphqlEndpoint);
