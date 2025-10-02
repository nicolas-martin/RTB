import { Quest, QuestProgress, ProjectMetadata } from '../types/quest.js';
import { questParser } from './questParser.js';
import { GraphQLService } from './graphqlClient.js';
import { BaseQuest } from '../models/index.js';
import { resolveVariableFunction } from './variableFunctions.js';

export class QuestService {
	private project: ProjectMetadata | null = null;
	private quests: BaseQuest[] = [];
	private questProgress: Map<string, QuestProgress> = new Map();
	private graphqlService: GraphQLService;

	constructor(graphqlEndpoint?: string) {
		this.graphqlService = new GraphQLService(graphqlEndpoint || '');
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
		playerId: string
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
			// Build query variables
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

			return {
				...quest.getConfig(),
				completed: validation.completed,
				progress: validation.progress,
			};
		} catch (error) {
			console.error(`Failed to check quest ${questId}:`, error);
			return null;
		}
	}

	async checkAllQuests(playerId: string): Promise<Quest[]> {
		const results: Quest[] = [];

		for (const quest of this.quests) {
			const result = await this.checkQuest(quest.getId(), playerId);
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
		this.questProgress.clear();
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
