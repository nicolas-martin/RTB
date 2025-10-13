import { create } from 'zustand';
import { projectManager } from '../services/projectManager';
import type { ProjectWithQuests } from '../types/context';

interface QuestProgressState {
	projectQuests: ProjectWithQuests[];
	userPoints: Map<string, number>;
	// Global stats (always includes ALL projects for top bar)
	globalProjectQuests: ProjectWithQuests[];
	globalUserPoints: Map<string, number>;
	loading: boolean;
	initialized: boolean;
	lastAccount: string | null;
	error?: string | null;
	initialize: (preloadedQuestData?: Record<string, any[]>) => Promise<void>;
	refreshForAccount: (account: string | null, projectIds?: string[]) => Promise<void>;
	manualRefresh: (projectIds?: string[]) => Promise<void>;
	reset: () => void;
}

const createEmptyPointsMap = () => new Map<string, number>();

export const useQuestProgressStore = create<QuestProgressState>((set, get) => ({
	projectQuests: [],
	userPoints: createEmptyPointsMap(),
	globalProjectQuests: [],
	globalUserPoints: createEmptyPointsMap(),
	loading: false,
	initialized: false,
	lastAccount: null,
	error: undefined,
	initialize: async (preloadedQuestData?: Record<string, any[]>) => {
		const { initialized } = get();
		if (initialized) return;

		set({ loading: true, error: undefined });

		try {
			// If we have preloaded data, use it directly
			if (preloadedQuestData) {
				console.log('[QuestProgressStore] Using preloaded quest data from SSG');
				await projectManager.loadFromPreloadedData(preloadedQuestData);
			} else {
				console.log('[QuestProgressStore] Loading quest data from API');
				await projectManager.loadAllProjects();
			}

			const quests = projectManager.getAllQuests();
			set({
				projectQuests: quests,
				initialized: true,
				loading: false,
			});
		} catch (error) {
			console.error('[QuestProgressStore] Failed to initialize projects', error);
			set({ error: error instanceof Error ? error.message : String(error), loading: false });
		}
	},
	refreshForAccount: async (account: string | null, projectIds?: string[]) => {
		const { lastAccount, initialized } = get();
		if (!initialized) {
			await get().initialize();
		}

		// Avoid redundant refresh if account unchanged and data already loaded
		if (account === lastAccount && get().projectQuests.length > 0) {
			return;
		}

		set({ loading: true, error: undefined });

		try {
			if (account) {
				console.log(`[QuestProgressStore] Loading cached progress first${projectIds ? ` for: ${projectIds.join(', ')}` : ''}...`);

				// For project-specific views, only load that project's data
				let globalCached, globalPoints, cached, points;

				if (projectIds && projectIds.length > 0) {
					// Project-specific view: only load the specified projects
					console.log(`[QuestProgressStore] Loading only ${projectIds.length} project(s)`);
					cached = await projectManager.loadCachedProgressForProjects(account, projectIds);
					points = await projectManager.getPointsForProjects(account, projectIds);

					// For global stats: reuse existing if available, otherwise load async
					const currentGlobal = get().globalProjectQuests;
					if (currentGlobal && currentGlobal.length > 0) {
						// Reuse existing global stats
						globalCached = currentGlobal;
						globalPoints = get().globalUserPoints;
						console.log(`[QuestProgressStore] Reusing existing global stats`);
					} else {
						// Load global stats async (won't block the UI)
						globalCached = [];
						globalPoints = new Map();
						// Schedule async load for global stats
						projectManager.loadCachedProgressForAllProjects(account).then(data => {
							set({ globalProjectQuests: data });
						});
						projectManager.getAllUserPoints(account).then(data => {
							set({ globalUserPoints: new Map(data) });
						});
					}
				} else {
					// Dashboard view: load all projects
					console.log(`[QuestProgressStore] Loading all projects for dashboard`);
					globalCached = await projectManager.loadCachedProgressForAllProjects(account);
					globalPoints = await projectManager.getAllUserPoints(account);
					cached = globalCached;
					points = globalPoints;
				}

				set({
					projectQuests: cached,
					userPoints: new Map(points),
					globalProjectQuests: globalCached,
					globalUserPoints: new Map(globalPoints),
					lastAccount: account,
					loading: false,
				});

				// Only refresh incomplete quests from GraphQL (selective refresh for better performance)
				const hasIncompleteQuests = cached.some(p =>
					p.quests.some(q => !q.completed)
				);

				if (hasIncompleteQuests) {
					console.log(`[QuestProgressStore] Found incomplete quests, refreshing from GraphQL${projectIds ? ` for: ${projectIds.join(', ')}` : ''}...`);

					// Determine which projects need refresh
					const projectsToRefresh = cached
						.filter(p => p.quests.some(q => !q.completed))
						.map(p => p.project.id);

					if (projectsToRefresh.length > 0) {
						// Only refresh projects with incomplete quests
						const updated = await projectManager.checkProjectsProgress(account, projectsToRefresh);
						const updatedPoints = await projectManager.getPointsForProjects(account, projectsToRefresh);

						// Merge updated data with cached data for other projects
						const mergedProjects = [...cached];
						for (const updatedProject of updated) {
							const index = mergedProjects.findIndex(p => p.project.id === updatedProject.project.id);
							if (index >= 0) {
								mergedProjects[index] = updatedProject;
							}
						}

						// Update points for refreshed projects
						const mergedPoints = new Map(points);
						updatedPoints.forEach((value, key) => mergedPoints.set(key, value));

						set({
							projectQuests: mergedProjects,
							userPoints: mergedPoints,
							// Global stats remain the same if we're only updating specific projects
							globalProjectQuests: projectIds ? get().globalProjectQuests : mergedProjects,
							globalUserPoints: projectIds ? get().globalUserPoints : mergedPoints,
						});
						console.log(`[QuestProgressStore] Selective refresh complete for ${projectsToRefresh.length} projects`);
					}
				} else {
					console.log('[QuestProgressStore] All quests completed, skipping GraphQL refresh');
				}
			} else {
				projectManager.clearAllProgress();
				set({
					projectQuests: projectManager.getAllQuests(),
					userPoints: createEmptyPointsMap(),
					globalProjectQuests: [],
					globalUserPoints: createEmptyPointsMap(),
					lastAccount: null,
					loading: false,
				});
			}
		} catch (error) {
			console.error('[QuestProgressStore] Failed to load quest progress', error);
			set({
				error: error instanceof Error ? error.message : String(error),
				loading: false,
			});
		}
	},
	manualRefresh: async (projectIds?: string[]) => {
		const { lastAccount } = get();
		if (!lastAccount) {
			console.warn('[QuestProgressStore] Cannot refresh without an account');
			return;
		}

		set({ loading: true, error: undefined });

		try {
			console.log(`[QuestProgressStore] Manual refresh${projectIds ? ` for: ${projectIds.join(', ')}` : ''}...`);
			// Refresh from GraphQL (slower but accurate)
			const updated = projectIds
				? await projectManager.checkProjectsProgress(lastAccount, projectIds)
				: await projectManager.checkAllProjectsProgress(lastAccount);

			const points = projectIds
				? await projectManager.getPointsForProjects(lastAccount, projectIds)
				: await projectManager.getAllUserPoints(lastAccount);

			set({
				projectQuests: updated,
				userPoints: new Map(points),
				loading: false,
			});
		} catch (error) {
			console.error('[QuestProgressStore] Failed to refresh quests', error);
			set({
				error: error instanceof Error ? error.message : String(error),
				loading: false,
			});
		}
	},
	reset: () => {
		set({
			projectQuests: [],
			userPoints: createEmptyPointsMap(),
			globalProjectQuests: [],
			globalUserPoints: createEmptyPointsMap(),
			loading: false,
			initialized: false,
			lastAccount: null,
			error: undefined,
		});
	},
}));
