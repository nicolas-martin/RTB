import { Quest, QuestProgress, ProjectMetadata, TransactionConfig } from '../types/quest.js';
import { questParser } from './questParser.js';
import { GraphQLService } from './graphqlClient.js';
import { BaseQuest } from '../models/index.js';
import { resolveVariableFunction } from './variableFunctions.js';
import { questDatabase } from '../database/questDatabase.js';

export class QuestService {
	private project: ProjectMetadata | null = null;
	private quests: BaseQuest[] = [];
	private transactions: TransactionConfig[] = [];
	private questProgress: Map<string, QuestProgress> = new Map();
	private graphqlService: GraphQLService;

	constructor(graphqlEndpoint?: string) {
		this.graphqlService = new GraphQLService(graphqlEndpoint || '');
	}

	async loadProject(tomlContent: string): Promise<void> {
		try {
			const { project, quests, transactions } =
				await questParser.parseProjectFromFile(tomlContent);
			this.project = project;
			this.quests = quests;
			this.transactions = transactions;
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
		walletAddress: string
	): Promise<Quest | null> {
		console.log(`[QuestService] Checking quest: ${questId} for wallet: ${walletAddress}`);

		const quest = this.quests.find((q) => q.getId() === questId);
		if (!quest) {
			console.error(`[QuestService] Quest not found: ${questId}`);
			return null;
		}

		if (!this.project) {
			console.error('[QuestService] Project not loaded');
			return null;
		}

		try {
			// Build query variables
			const variables = await this.buildQueryVariables(quest.getQuery(), walletAddress, quest.getConfig());

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

			// Check existing progress before updating
			const existingProgress = await questDatabase.getQuestProgress(
				walletAddress,
				questId,
				this.project.id
			);

			// Persist to database
			const now = new Date().toISOString();
			const questConfig = quest.getConfig();
			const pointsEarned = validation.completed ? questConfig.reward : 0;

			await questDatabase.upsertQuestProgress({
				wallet_address: walletAddress,
				project_id: this.project.id,
				quest_id: questId,
				completed: validation.completed,
				progress: validation.progress ?? null,
				points_earned: pointsEarned,
				completed_at: validation.completed ? now : null,
				last_checked_at: now,
			});

			// If newly completed, create points transaction
			if (validation.completed && (!existingProgress || !existingProgress.completed)) {
				await questDatabase.createPointsTransaction({
					wallet_address: walletAddress,
					project_id: this.project.id,
					transaction_type: 'earned',
					amount: pointsEarned,
					quest_id: questId,
				});
			}

			return {
				...questConfig,
				completed: validation.completed,
				progress: validation.progress,
			};
		} catch (error) {
			console.error(`Failed to check quest ${questId}:`, error);
			return null;
		}
	}

	async checkAllQuests(walletAddress: string): Promise<Quest[]> {
		if (!this.project) {
			console.error('[QuestService] Project not loaded');
			return [];
		}

		// Get existing progress from database
		const existingProgress = await questDatabase.getUserQuestProgress(
			walletAddress,
			this.project.id
		);
		const completedQuestIds = new Set(
			existingProgress.filter(p => p.completed).map(p => p.quest_id)
		);

		const results: Quest[] = [];

		for (const quest of this.quests) {
			const questId = quest.getId();

			// Skip GraphQL check if already completed
			if (completedQuestIds.has(questId)) {
				console.log(`[QuestService] Skipping ${questId} (already completed)`);
				const cached = existingProgress.find(p => p.quest_id === questId);
				results.push({
					...quest.getConfig(),
					completed: true,
					progress: cached?.progress ?? undefined,
				});
				continue;
			}

			// Check uncompleted quests via GraphQL
			const result = await this.checkQuest(questId, walletAddress);
			if (result) {
				results.push(result);
			}
		}

		return results;
	}

	getQuests(): BaseQuest[] {
		return this.quests;
	}

	getTransactions(): TransactionConfig[] {
		return this.transactions;
	}

	async executeTransaction(transactionName: string, walletAddress: string): Promise<any> {
		if (!this.project) {
			throw new Error('Project not loaded');
		}

		const transaction = this.transactions.find((t) => t.name === transactionName);
		if (!transaction) {
			throw new Error(`Transaction not found: ${transactionName}`);
		}

		try {
			// Build query variables
			const variables = await this.buildQueryVariables(transaction.query, walletAddress, {});

			// Execute the GraphQL query
			const result = await this.graphqlService.executeQuery(
				transaction.query,
				variables
			);

			return result;
		} catch (error) {
			console.error(`Failed to execute transaction ${transactionName}:`, error);
			throw error;
		}
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

	/**
	 * Load cached quest progress from database
	 */
	async loadCachedProgress(walletAddress: string): Promise<Quest[]> {
		if (!this.project) {
			throw new Error('Project not loaded');
		}

		const cachedProgress = await questDatabase.getUserQuestProgress(
			walletAddress,
			this.project.id
		);

		// Build a map of cached progress
		const progressMap = new Map(
			cachedProgress.map((p) => [p.quest_id, p])
		);

		return this.quests.map((quest) => {
			const cached = progressMap.get(quest.getId());
			return {
				...quest.getConfig(),
				completed: cached?.completed ?? false,
				progress: cached?.progress ?? undefined,
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
