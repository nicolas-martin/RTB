import { create } from 'zustand';
import { projectManager } from '../services/projectManager';
import type { ProjectWithQuests } from '../types/context';

interface QuestProgressState {
	projectQuests: ProjectWithQuests[];
	userPoints: Map<string, number>;
	loading: boolean;
	initialized: boolean;
	lastAccount: string | null;
	error?: string | null;
	initialize: () => Promise<void>;
	refreshForAccount: (account: string | null) => Promise<void>;
	reset: () => void;
}

const createEmptyPointsMap = () => new Map<string, number>();

export const useQuestProgressStore = create<QuestProgressState>((set, get) => ({
	projectQuests: [],
	userPoints: createEmptyPointsMap(),
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
	refreshForAccount: async (account: string | null) => {
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
				const updated = await projectManager.checkAllProjectsProgress(account);
				const points = await projectManager.getAllUserPoints(account);
				set({
					projectQuests: updated,
					userPoints: new Map(points),
					lastAccount: account,
					loading: false,
				});
			} else {
				projectManager.clearAllProgress();
				set({
					projectQuests: projectManager.getAllQuests(),
					userPoints: createEmptyPointsMap(),
					lastAccount: null,
					loading: false,
				});
			}
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
			loading: false,
			initialized: false,
			lastAccount: null,
			error: undefined,
		});
	},
}));
