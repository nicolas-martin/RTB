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
	initialize: () => Promise<void>;
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
	initialize: async () => {
		const { initialized } = get();
		if (initialized) return;

		set({ loading: true, error: undefined });

		try {
			await projectManager.loadAllProjects();
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

				// Always load global stats (for top bar)
				const globalCached = await projectManager.loadCachedProgressForAllProjects(account);
				const globalPoints = await projectManager.getAllUserPoints(account);

				// Load project-specific or all projects
				const cached = projectIds
					? await projectManager.loadCachedProgressForProjects(account, projectIds)
					: globalCached;

				const points = projectIds
					? await projectManager.getPointsForProjects(account, projectIds)
					: globalPoints;

				set({
					projectQuests: cached,
					userPoints: new Map(points),
					globalProjectQuests: globalCached,
					globalUserPoints: new Map(globalPoints),
					lastAccount: account,
					loading: false,
				});

				// Then automatically refresh from GraphQL for uncompleted quests (slower but accurate)
				console.log(`[QuestProgressStore] Triggering automatic GraphQL refresh${projectIds ? ` for: ${projectIds.join(', ')}` : ''}...`);

				// Always refresh global stats
				const globalUpdated = await projectManager.checkAllProjectsProgress(account);
				const globalUpdatedPoints = await projectManager.getAllUserPoints(account);

				// Refresh project-specific or all projects
				const updated = projectIds
					? await projectManager.checkProjectsProgress(account, projectIds)
					: globalUpdated;

				const updatedPoints = projectIds
					? await projectManager.getPointsForProjects(account, projectIds)
					: globalUpdatedPoints;

				set({
					projectQuests: updated,
					userPoints: new Map(updatedPoints),
					globalProjectQuests: globalUpdated,
					globalUserPoints: new Map(globalUpdatedPoints),
				});
				console.log('[QuestProgressStore] Automatic refresh complete');
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
