import { QuestConfig, Quest, QuestProgress, ProjectMetadata } from '../types/quest';
import { questParser } from './questParser';
import { questValidator } from './questValidator';
import { GraphQLService } from './graphqlClient';

export class QuestService {
	private project: ProjectMetadata | null = null;
	private quests: QuestConfig[] = [];
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
			this.loadProgressFromStorage(project.id);
		} catch (error) {
			console.error('Failed to load project:', error);
			throw error;
		}
	}

	getProject(): ProjectMetadata | null {
		return this.project;
	}

	async checkQuest(questId: string, playerId: string): Promise<Quest | null> {
		const questConfig = this.quests.find((q) => q.id === questId);
		if (!questConfig) {
			console.error(`Quest not found: ${questId}`);
			return null;
		}

		try {
			const queryResult = await this.graphqlService.executeQuery(
				questConfig.query,
				{
					playerId,
				}
			);

			const validation = questValidator.validateQuest(questConfig, queryResult);

			const progress: QuestProgress = {
				questId,
				completed: validation.completed,
				progress: validation.progress,
				lastUpdated: new Date().toISOString(),
			};

			this.questProgress.set(questId, progress);
			this.saveProgressToStorage();

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

	async checkAllQuests(playerId: string): Promise<Quest[]> {
		const results: Quest[] = [];

		for (const questConfig of this.quests) {
			const quest = await this.checkQuest(questConfig.id, playerId);
			if (quest) {
				results.push(quest);
			}
		}

		return results;
	}

	getQuests(): QuestConfig[] {
		return this.quests;
	}

	getQuestsWithProgress(): Quest[] {
		return this.quests.map((quest) => {
			const progress = this.questProgress.get(quest.id);
			return {
				...quest,
				completed: progress?.completed ?? false,
				progress: progress?.progress,
			};
		});
	}

	getQuestById(questId: string): Quest | null {
		const questConfig = this.quests.find((q) => q.id === questId);
		if (!questConfig) return null;

		const progress = this.questProgress.get(questId);
		return {
			...questConfig,
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

	private loadProgressFromStorage(projectId: string): void {
		try {
			if (typeof localStorage !== 'undefined') {
				const stored = localStorage.getItem(`quest_progress_${projectId}`);
				if (stored) {
					const parsed = JSON.parse(stored);
					this.questProgress = new Map(Object.entries(parsed));
				}
			}
		} catch (error) {
			console.error('Failed to load quest progress from storage:', error);
		}
	}

	private saveProgressToStorage(): void {
		if (!this.project) return;

		try {
			if (typeof localStorage !== 'undefined') {
				const obj = Object.fromEntries(this.questProgress);
				localStorage.setItem(
					`quest_progress_${this.project.id}`,
					JSON.stringify(obj)
				);
			}
		} catch (error) {
			console.error('Failed to save quest progress to storage:', error);
		}
	}

	updateGraphQLEndpoint(endpoint: string): void {
		this.graphqlService.updateEndpoint(endpoint);
	}

	clearProgress(): void {
		if (!this.project) return;

		this.questProgress.clear();
		if (typeof localStorage !== 'undefined') {
			localStorage.removeItem(`quest_progress_${this.project.id}`);
		}
	}
}

export const createQuestService = (graphqlEndpoint?: string) =>
	new QuestService(graphqlEndpoint);
