import { create } from 'zustand';
import { projectManager } from '../services/projectManager';
import type { ProjectWithQuests } from '../types/context';
import { questApiClient } from '../services/questApiClient';
import { QUEST_PROJECT_IDS, PARTNER_APP_IDS } from '../constants';
import type { Quest } from '../types/quest';

// Types for earning history and transaction history
interface QuestCompletion {
	quest_id: string;
	project_id: string;
	quest_title: string;
	points_earned: number;
	completed_at: string;
}

interface NormalizedTransaction {
	timestamp: string;
	transaction_type: string;
	amount: string;
	points_earned: number;
	projectId?: string;
	transactionHash?: string;
}

interface QuestProgressState {
	projectQuests: ProjectWithQuests[];
	userPoints: Map<string, number>;
	// Global stats (always includes ALL projects for top bar)
	globalProjectQuests: ProjectWithQuests[];
	globalUserPoints: Map<string, number>;
	// Profile page data
	earningHistory: QuestCompletion[];
	transactionHistory: NormalizedTransaction[];
	earningHistoryLoading: boolean;
	transactionHistoryLoading: boolean;
	loading: boolean;
	initialized: boolean;
	initializing: boolean;  // Track if initialization is in progress
	lastAccount: string | null;
	error?: string | null;
	initialize: (preloadedQuestData?: Record<string, any[]>) => Promise<void>;
	refreshForAccount: (account: string | null, projectIds?: string[], preloadedQuestData?: Record<string, any[]>) => Promise<void>;
	manualRefresh: (projectIds?: string[]) => Promise<void>;
	loadEarningHistory: (account: string) => Promise<void>;
	loadTransactionHistory: (account: string, projectId?: string) => Promise<void>;
	reset: () => void;
}

const createEmptyPointsMap = () => new Map<string, number>();

export const useQuestProgressStore = create<QuestProgressState>((set, get) => ({
	projectQuests: [],
	userPoints: createEmptyPointsMap(),
	globalProjectQuests: [],
	globalUserPoints: createEmptyPointsMap(),
	earningHistory: [],
	transactionHistory: [],
	earningHistoryLoading: false,
	transactionHistoryLoading: false,
	loading: false,
	initialized: false,
	initializing: false,
	lastAccount: null,
	error: undefined,
	initialize: async (preloadedQuestData?: Record<string, any[]>) => {
		const { initialized, initializing } = get();

		// Prevent duplicate initialization
		if (initialized || initializing) {
			console.log('[QuestProgressStore] Already initialized or initializing, skipping');
			return;
		}

		set({ loading: true, initializing: true, error: undefined });

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
				initializing: false,
				loading: false,
			});
		} catch (error) {
			console.error('[QuestProgressStore] Failed to initialize projects', error);
			set({
				error: error instanceof Error ? error.message : String(error),
				loading: false,
				initializing: false
			});
		}
	},
	refreshForAccount: async (account: string | null, projectIds?: string[], preloadedQuestData?: Record<string, any[]>) => {
		const { lastAccount, initialized, initializing } = get();

		// Wait for initialization to complete if it's in progress
		if (!initialized) {
			if (initializing) {
				console.log('[QuestProgressStore] Waiting for initialization to complete...');
				// Wait for initialization to complete
				await new Promise<void>((resolve) => {
					const unsubscribe = useQuestProgressStore.subscribe((state) => {
						if (state.initialized || !state.initializing) {
							unsubscribe();
							resolve();
						}
					});
				});
			} else {
				// If not initialized and not initializing, start initialization
				await get().initialize(preloadedQuestData);
			}
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
	loadEarningHistory: async (account: string) => {
		set({ earningHistoryLoading: true });

		try {
			console.log('[QuestProgressStore] Loading earning history for:', account);
			const allCompletions: QuestCompletion[] = [];

			// Fetch progress and quest metadata for each project
			for (const projectId of QUEST_PROJECT_IDS) {
				try {
					// Get quest metadata
					const quests = await questApiClient.getQuests(projectId);
					const questMap = new Map<string, Quest>(quests.map(q => [q.id, q]));

					// Get progress data
					const progressData = await questApiClient.getCachedProgress(account, projectId);

					// Filter for completed quests only
					const completed = progressData
						.filter(p => p.completed && p.completed_at)
						.map(p => ({
							quest_id: p.quest_id,
							project_id: projectId,
							quest_title: questMap.get(p.quest_id)?.title || p.quest_id,
							points_earned: p.points_earned,
							completed_at: p.completed_at!,
						}));

					allCompletions.push(...completed);
				} catch (err) {
					console.error(`[QuestProgressStore] Failed to fetch earning history for ${projectId}:`, err);
				}
			}

			// Sort by completion date (newest first)
			allCompletions.sort((a, b) =>
				new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
			);

			console.log('[QuestProgressStore] Found', allCompletions.length, 'completed quests');
			set({ earningHistory: allCompletions, earningHistoryLoading: false });
		} catch (err) {
			console.error('[QuestProgressStore] Error loading earning history:', err);
			set({ earningHistoryLoading: false });
		}
	},
	loadTransactionHistory: async (account: string, projectId?: string) => {
		set({ transactionHistoryLoading: true });

		try {
			if (projectId && projectId !== 'all') {
				// Fetch from single project
				console.log('[QuestProgressStore] Loading transactions for:', account, projectId);
				const txs = await questApiClient.getGraphQLTransactions(account, projectId);
				// Add projectId to each transaction
				const withProjectId = txs.map(tx => ({ ...tx, projectId }));
				set({ transactionHistory: withProjectId, transactionHistoryLoading: false });
				console.log('[QuestProgressStore] Found', txs.length, 'transactions');
			} else {
				// Fetch from all projects
				console.log('[QuestProgressStore] Loading transactions from all projects for:', account);
				const allTransactions = await Promise.all(
					PARTNER_APP_IDS.map(async (pid) => {
						try {
							const txs = await questApiClient.getGraphQLTransactions(account, pid);
							// Add projectId to each transaction
							return txs.map(tx => ({ ...tx, projectId: pid }));
						} catch (err) {
							console.error(`[QuestProgressStore] Error fetching transactions for ${pid}:`, err);
							return [];
						}
					})
				);

				// Flatten and sort by timestamp
				const flattened = allTransactions.flat().sort((a, b) =>
					new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
				);

				set({ transactionHistory: flattened, transactionHistoryLoading: false });
				console.log('[QuestProgressStore] Found', flattened.length, 'total transactions');
			}
		} catch (err) {
			console.error('[QuestProgressStore] Error loading transaction history:', err);
			set({ transactionHistory: [], transactionHistoryLoading: false });
		}
	},
	reset: () => {
		set({
			projectQuests: [],
			userPoints: createEmptyPointsMap(),
			globalProjectQuests: [],
			globalUserPoints: createEmptyPointsMap(),
			earningHistory: [],
			transactionHistory: [],
			earningHistoryLoading: false,
			transactionHistoryLoading: false,
			loading: false,
			initialized: false,
			initializing: false,
			lastAccount: null,
			error: undefined,
		});
	},
}));
