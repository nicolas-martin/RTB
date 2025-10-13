import type { ProjectMetadata, Quest } from '../types/quest';
import { questApiClient, type PointsSummary } from './questApiClient';
import { QUEST_PROJECT_IDS, type QuestProjectId } from '../constants';

// Re-export for backwards compatibility
export { QUEST_PROJECT_IDS, type QuestProjectId };

export class ProjectManager {
	private projectQuests: Map<string, Quest[]> = new Map();
	private availableProjects: QuestProjectId[] = [...QUEST_PROJECT_IDS];

	async loadProject(projectId: string): Promise<void> {
		try {
			console.log(`[ProjectManager] Loading project from API: ${projectId}`);

			// Load quest metadata from API instead of TOML file
			const quests = await questApiClient.getQuests(projectId);
			console.log(`[ProjectManager] Loaded ${quests.length} quests for ${projectId}`);

			this.projectQuests.set(projectId, quests);
		} catch (error) {
			console.error(`[ProjectManager] Failed to load project ${projectId}:`, error);
			throw error;
		}
	}

	async loadFromPreloadedData(preloadedData: Record<string, any[]>): Promise<void> {
		console.log(`[ProjectManager] Loading from preloaded SSG data`);

		for (const [projectId, quests] of Object.entries(preloadedData)) {
			console.log(`[ProjectManager] Loaded ${quests.length} quests for ${projectId} from SSG`);
			this.projectQuests.set(projectId, quests);
		}
	}

	async loadAllProjects(): Promise<void> {
		console.log(`[ProjectManager] Loading all projects: ${this.availableProjects.join(', ')}`);

		// Use batch endpoint for better performance
		try {
			const batchData = await questApiClient.getBatchQuests(this.availableProjects);

			for (const [projectId, data] of Object.entries(batchData)) {
				console.log(`[ProjectManager] Loaded ${data.quests.length} quests for ${projectId} from batch`);
				this.projectQuests.set(projectId, data.quests);
			}
		} catch (error) {
			console.error('[ProjectManager] Batch load failed, falling back to individual loads:', error);
			// Fall back to individual loading if batch fails
			for (const projectId of this.availableProjects) {
				try {
					await this.loadProject(projectId);
				} catch (error) {
					console.warn(`Failed to load project ${projectId}:`, error);
				}
			}
		}
	}

	getProject(projectId: string): ProjectMetadata | null {
		// Return basic project metadata
		if (this.projectQuests.has(projectId)) {
			return {
				id: projectId,
				name: projectId.toUpperCase(),
				description: `${projectId} project`,
				graphqlEndpoint: '' // Not needed on frontend anymore
			};
		}
		return null;
	}

	getAllProjects(): ProjectMetadata[] {
		return Array.from(this.projectQuests.keys()).map(id => ({
			id,
			name: id.toUpperCase(),
			description: `${id} project`,
			graphqlEndpoint: ''
		}));
	}

	getQuestsForProject(projectId: string): Quest[] {
		return this.projectQuests.get(projectId) ?? [];
	}

	getAllQuests(): { project: ProjectMetadata; quests: Quest[] }[] {
		const results: { project: ProjectMetadata; quests: Quest[] }[] = [];

		for (const [projectId, quests] of this.projectQuests.entries()) {
			results.push({
				project: this.getProject(projectId)!,
				quests
			});
		}

		return results;
	}

	/**
	 * Load cached progress from API for specific projects
	 */
	async loadCachedProgressForProjects(
		walletAddress: string,
		projectIds: string[]
	): Promise<{ project: ProjectMetadata; quests: Quest[] }[]> {
		console.log(`[ProjectManager] Loading cached progress for projects: ${projectIds.join(', ')}, wallet: ${walletAddress}`);
		const results: { project: ProjectMetadata; quests: Quest[] }[] = [];

		for (const projectId of projectIds) {
			const questMetadata = this.projectQuests.get(projectId);
			if (!questMetadata) {
				console.warn(`[ProjectManager] Project ${projectId} not loaded, skipping`);
				continue;
			}

			try {
				console.log(`[ProjectManager] Fetching cached progress for ${projectId}`);
				const progressData = await questApiClient.getCachedProgress(walletAddress, projectId);
				console.log(`[ProjectManager] Got ${progressData.length} progress records for ${projectId}`);

				const progressMap = new Map(progressData.map(p => [p.quest_id, p]));

				// Merge quest metadata with progress data
				const quests = questMetadata.map(quest => {
					const progress = progressMap.get(quest.id);
					return {
						...quest,
						completed: progress?.completed ?? false,
						progress: progress?.progress ?? undefined
					};
				});

				const project = this.getProject(projectId)!;
				results.push({ project, quests });
			} catch (error) {
				console.error(`[ProjectManager] Failed to load cached progress for ${projectId}:`, error);
				// Fall back to quests without progress
				const project = this.getProject(projectId)!;
				const quests = questMetadata.map(q => ({ ...q, completed: false }));
				results.push({ project, quests });
			}
		}

		return results;
	}

	/**
	 * Load cached progress from API (fast, uses Supabase cache)
	 */
	async loadCachedProgressForAllProjects(
		walletAddress: string
	): Promise<{ project: ProjectMetadata; quests: Quest[] }[]> {
		console.log(`[ProjectManager] Loading cached progress for wallet: ${walletAddress}`);
		const results: { project: ProjectMetadata; quests: Quest[] }[] = [];
		const projectIds = Array.from(this.projectQuests.keys());

		try {
			// Use batch endpoint for better performance
			const batchProgress = await questApiClient.getBatchCachedProgress(walletAddress, projectIds);

			for (const [projectId, progressData] of Object.entries(batchProgress)) {
				const questMetadata = this.projectQuests.get(projectId);
				if (!questMetadata) continue;

				console.log(`[ProjectManager] Got ${progressData.length} progress records for ${projectId}`);
				const progressMap = new Map(progressData.map(p => [p.quest_id, p]));

				// Merge quest metadata with progress data
				const quests = questMetadata.map(quest => {
					const progress = progressMap.get(quest.id);
					return {
						...quest,
						completed: progress?.completed ?? false,
						progress: progress?.progress ?? undefined
					};
				});

				const project = this.getProject(projectId)!;
				results.push({ project, quests });
			}
		} catch (error) {
			console.error('[ProjectManager] Batch progress load failed, falling back to individual loads:', error);
			// Fall back to individual loading if batch fails
			for (const [projectId, questMetadata] of this.projectQuests.entries()) {
				try {
					const progressData = await questApiClient.getCachedProgress(walletAddress, projectId);
					const progressMap = new Map(progressData.map(p => [p.quest_id, p]));

					const quests = questMetadata.map(quest => {
						const progress = progressMap.get(quest.id);
						return {
							...quest,
							completed: progress?.completed ?? false,
							progress: progress?.progress ?? undefined
						};
					});

					const project = this.getProject(projectId)!;
					results.push({ project, quests });
				} catch (error) {
					console.error(`[ProjectManager] Failed to load cached progress for ${projectId}:`, error);
					const project = this.getProject(projectId)!;
					const quests = questMetadata.map(q => ({ ...q, completed: false }));
					results.push({ project, quests });
				}
			}
		}

		return results;
	}

	/**
	 * Refresh progress from GraphQL for specific projects (slower, checks blockchain)
	 */
	async checkProjectsProgress(walletAddress: string, projectIds: string[]): Promise<{ project: ProjectMetadata; quests: Quest[] }[]> {
		console.log(`[ProjectManager] Refreshing progress from GraphQL for projects: ${projectIds.join(', ')}, wallet: ${walletAddress}`);
		const results: { project: ProjectMetadata; quests: Quest[] }[] = [];

		for (const projectId of projectIds) {
			const questMetadata = this.projectQuests.get(projectId);
			if (!questMetadata) {
				console.warn(`[ProjectManager] Project ${projectId} not loaded, skipping`);
				continue;
			}

			try {
				console.log(`[ProjectManager] Refreshing progress for ${projectId}`);
				const progressData = await questApiClient.refreshProgress(walletAddress, projectId);
				console.log(`[ProjectManager] Got refreshed ${progressData.length} progress records for ${projectId}`);

				const progressMap = new Map(progressData.map(p => [p.quest_id, p]));

				// Merge quest metadata with progress data
				const quests = questMetadata.map(quest => {
					const progress = progressMap.get(quest.id);
					return {
						...quest,
						completed: progress?.completed ?? false,
						progress: progress?.progress ?? undefined
					};
				});

				const project = this.getProject(projectId)!;
				results.push({ project, quests });
			} catch (error) {
				console.error(`[ProjectManager] Failed to refresh progress for ${projectId}:`, error);
				// Try to fall back to cached data
				try {
					const progressData = await questApiClient.getCachedProgress(walletAddress, projectId);
					const progressMap = new Map(progressData.map(p => [p.quest_id, p]));

					const quests = questMetadata.map(quest => {
						const progress = progressMap.get(quest.id);
						return {
							...quest,
							completed: progress?.completed ?? false,
							progress: progress?.progress ?? undefined
						};
					});

					const project = this.getProject(projectId)!;
					results.push({ project, quests });
				} catch {
					// Last resort: quests without progress
					const project = this.getProject(projectId)!;
					const quests = questMetadata.map(q => ({ ...q, completed: false }));
					results.push({ project, quests });
				}
			}
		}

		return results;
	}

	/**
	 * Refresh progress from GraphQL (slower, checks blockchain)
	 */
	async checkAllProjectsProgress(walletAddress: string): Promise<{ project: ProjectMetadata; quests: Quest[] }[]> {
		console.log(`[ProjectManager] Refreshing progress from GraphQL for wallet: ${walletAddress}`);
		const results: { project: ProjectMetadata; quests: Quest[] }[] = [];
		const projectIds = Array.from(this.projectQuests.keys());

		try {
			// Use batch endpoint for better performance
			const batchProgress = await questApiClient.batchRefreshProgress(walletAddress, projectIds);

			for (const [projectId, progressData] of Object.entries(batchProgress)) {
				const questMetadata = this.projectQuests.get(projectId);
				if (!questMetadata) continue;

				console.log(`[ProjectManager] Got refreshed ${progressData.length} progress records for ${projectId}`);
				const progressMap = new Map(progressData.map(p => [p.quest_id, p]));

				// Merge quest metadata with progress data
				const quests = questMetadata.map(quest => {
					const progress = progressMap.get(quest.id);
					return {
						...quest,
						completed: progress?.completed ?? false,
						progress: progress?.progress ?? undefined
					};
				});

				const project = this.getProject(projectId)!;
				results.push({ project, quests });
			}
		} catch (error) {
			console.error('[ProjectManager] Batch refresh failed, falling back to individual refreshes:', error);
			// Fall back to individual refreshing if batch fails
			for (const [projectId, questMetadata] of this.projectQuests.entries()) {
				try {
					const progressData = await questApiClient.refreshProgress(walletAddress, projectId);
					const progressMap = new Map(progressData.map(p => [p.quest_id, p]));

					const quests = questMetadata.map(quest => {
						const progress = progressMap.get(quest.id);
						return {
							...quest,
							completed: progress?.completed ?? false,
							progress: progress?.progress ?? undefined
						};
					});

					const project = this.getProject(projectId)!;
					results.push({ project, quests });
				} catch (error) {
					console.error(`[ProjectManager] Failed to refresh progress for ${projectId}:`, error);
					// Try cached data as fallback
					try {
						const progressData = await questApiClient.getCachedProgress(walletAddress, projectId);
						const progressMap = new Map(progressData.map(p => [p.quest_id, p]));

						const quests = questMetadata.map(quest => {
							const progress = progressMap.get(quest.id);
							return {
								...quest,
								completed: progress?.completed ?? false,
								progress: progress?.progress ?? undefined
							};
						});

						const project = this.getProject(projectId)!;
						results.push({ project, quests });
					} catch {
						// Last resort: quests without progress
						const project = this.getProject(projectId)!;
						const quests = questMetadata.map(q => ({ ...q, completed: false }));
						results.push({ project, quests });
					}
				}
			}
		}

		return results;
	}

	async getUserPointsForProject(projectId: string, walletAddress: string): Promise<number> {
		try {
			console.log(`[ProjectManager] Getting points for ${projectId}, wallet: ${walletAddress}`);
			const summaries = await questApiClient.getPointsSummary(walletAddress, projectId);
			return summaries[0]?.available ?? 0;
		} catch (error) {
			console.error(`Failed to get points for project ${projectId}:`, error);
			return 0;
		}
	}

	async getPointsForProjects(walletAddress: string, projectIds: string[]): Promise<Map<string, number>> {
		console.log(`[ProjectManager] Getting points for projects: ${projectIds.join(', ')}, wallet: ${walletAddress}`);
		const pointsMap = new Map<string, number>();

		for (const projectId of projectIds) {
			try {
				const summaries = await questApiClient.getPointsSummary(walletAddress, projectId);
				const available = summaries[0]?.available ?? 0;
				pointsMap.set(projectId, available);
				console.log(`[ProjectManager] ${projectId} points: ${available}`);
			} catch (error) {
				console.error(`Failed to get points for project ${projectId}:`, error);
				pointsMap.set(projectId, 0);
			}
		}

		return pointsMap;
	}

	async getAllUserPoints(walletAddress: string): Promise<Map<string, number>> {
		console.log(`[ProjectManager] Getting all points for wallet: ${walletAddress}`);
		const pointsMap = new Map<string, number>();

		try {
			// Use batch endpoint for all points (no projectIds filter means get all)
			const batchPoints = await questApiClient.getBatchPointsSummary(walletAddress);

			for (const [projectId, summary] of Object.entries(batchPoints)) {
				pointsMap.set(projectId, summary.available);
				console.log(`[ProjectManager] ${projectId} points: ${summary.available}`);
			}
		} catch (error) {
			console.error(`Failed to get all points:`, error);
			// Fall back to 0 points for all projects
			for (const projectId of this.projectQuests.keys()) {
				pointsMap.set(projectId, 0);
			}
		}

		return pointsMap;
	}

	async redeemPoints(
		walletAddress: string,
		projectId: string,
		amount: number,
		reason: string
	): Promise<PointsSummary> {
		console.log(`[ProjectManager] Redeeming ${amount} points for ${projectId}`);
		return await questApiClient.redeemPoints(walletAddress, projectId, amount, reason);
	}

	clearAllProgress(): void {
		// Not needed anymore - progress is in database
		console.log('[ProjectManager] clearAllProgress called (no-op)');
	}
}

export const projectManager = new ProjectManager();
