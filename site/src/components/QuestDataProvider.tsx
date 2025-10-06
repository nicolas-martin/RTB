import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from 'react';
import type { ProjectWithQuests, QuestTotals } from '@quest-src/types/context';
import type { QuestProjectId } from '@quest-src/services/projectManager';
import { useMetaMask } from '@quest-src/hooks/useMetaMask';
import { useQuestProgressStore } from '@quest-src/stores/questProgressStore';

interface QuestDataContextValue {
	projectQuests: ProjectWithQuests[];
	loading: boolean;
	userPoints: Map<string, number>;
	totals: QuestTotals;
	error?: string | null;
	account: string | null;
	isConnected: boolean;
	isConnecting: boolean;
	handleConnect: () => Promise<void>;
}

const QuestDataContext = createContext<QuestDataContextValue | null>(null);

interface QuestDataProviderProps {
	children: ReactNode;
	projectIds?: QuestProjectId[];
}

export function QuestDataProvider({ children, projectIds }: QuestDataProviderProps) {
	const storeProjectQuests = useQuestProgressStore((state) => state.projectQuests);
	const storeUserPoints = useQuestProgressStore((state) => state.userPoints);
	const storeLoading = useQuestProgressStore((state) => state.loading);
	const storeError = useQuestProgressStore((state) => state.error);
	const initialize = useQuestProgressStore((state) => state.initialize);
	const refreshForAccount = useQuestProgressStore((state) => state.refreshForAccount);

	const [projectQuests, setProjectQuests] = useState<ProjectWithQuests[]>([]);
	const [userPoints, setUserPoints] = useState<Map<string, number>>(new Map());
	const [loading, setLoading] = useState<boolean>(true);

	const projectFilter = useMemo(() => {
		// Temporarily disable filtering to debug
		return null;
	}, [projectIds]);

	const filterProjects = useCallback(
		(items: ProjectWithQuests[]): ProjectWithQuests[] => {
			// Temporarily disable filtering to debug
			return items;
		},
		[projectFilter]
	);

	const filterPoints = useCallback(
		(points: Map<string, number>): Map<string, number> => {
			const filtered = new Map<string, number>();
			points.forEach((value, key) => {
				if (!projectFilter || projectFilter.has(key.toLowerCase())) {
					filtered.set(key, value ?? 0);
				}
			});
			return filtered;
		},
		[projectFilter]
	);

	const {
		account,
		isConnected,
		isConnecting,
		error,
		connectWallet,
		disconnectWallet,
	} = useMetaMask();

	// Initial load of available projects
	useEffect(() => {
		initialize();
	}, [initialize]);

	// Refresh quest status and points when wallet state changes
	useEffect(() => {
		refreshForAccount(isConnected && account ? account : null, projectIds);
	}, [isConnected, account, projectIds, refreshForAccount]);

	useEffect(() => {
		setProjectQuests(filterProjects(storeProjectQuests));
	}, [storeProjectQuests, filterProjects]);

	useEffect(() => {
		setUserPoints(filterPoints(storeUserPoints));
	}, [storeUserPoints, filterPoints]);

	useEffect(() => {
		setLoading(storeLoading);
	}, [storeLoading]);

	const totals = useMemo<QuestTotals>(() => {
		const totalQuests = projectQuests.reduce((acc, item) => acc + item.quests.length, 0);
		const completed = projectQuests.reduce(
			(acc, item) => acc + item.quests.filter((quest) => quest.completed).length,
			0
		);
		const points = Array.from(userPoints.values()).reduce((acc, value) => acc + value, 0);

		return {
			totalQuests,
			completed,
			completionPct: totalQuests ? Math.round((completed / totalQuests) * 100) : 0,
			points,
		};
	}, [projectQuests, userPoints]);

	const combinedError = error ?? storeError;

	const handleConnect = useCallback(async () => {
		if (isConnected) {
			await disconnectWallet();
			return;
		}

		await connectWallet();
	}, [isConnected, disconnectWallet, connectWallet]);

	const value = useMemo<QuestDataContextValue>(() => ({
		projectQuests,
		loading,
		userPoints,
		totals,
		error: combinedError,
		account,
		isConnected,
		isConnecting,
		handleConnect,
	}), [
		projectQuests,
		loading,
		userPoints,
		totals,
		combinedError,
		account,
		isConnected,
		isConnecting,
		handleConnect,
	]);

	return <QuestDataContext.Provider value={value}>{children}</QuestDataContext.Provider>;
}

export function useQuestData(): QuestDataContextValue {
	const context = useContext(QuestDataContext);
	if (!context) {
		throw new Error('useQuestData must be used within a QuestDataProvider');
	}
	return context;
}
