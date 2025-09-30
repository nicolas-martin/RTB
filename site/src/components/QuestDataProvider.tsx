import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from 'react';
import type { Quest, ProjectMetadata } from '@quest-src/types/quest';
import { projectManager, type QuestProjectId } from '@quest-src/services/projectManager';
import { useMetaMask } from '@quest-src/hooks/useMetaMask';

export interface ProjectWithQuests {
	project: ProjectMetadata;
	quests: Quest[];
}

export interface QuestTotals {
	totalQuests: number;
	completed: number;
	completionPct: number;
	points: number;
}

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
	const [projectQuests, setProjectQuests] = useState<ProjectWithQuests[]>([]);
	const [loading, setLoading] = useState(true);
	const [userPoints, setUserPoints] = useState<Map<string, number>>(new Map());

	const projectFilter = useMemo(() => {
		if (!projectIds || projectIds.length === 0) return null;
		return new Set(projectIds.map((id) => id.toLowerCase()));
	}, [projectIds]);

	const filterProjects = useCallback(
		(items: ProjectWithQuests[]): ProjectWithQuests[] => {
			if (!projectFilter) return items;
			return items.filter((entry) => projectFilter.has(entry.project.id.toLowerCase()));
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
		const init = async () => {
			try {
				await projectManager.loadAllProjects();
				const all = projectManager.getAllQuests();
				setProjectQuests(filterProjects(all));
			} finally {
				setLoading(false);
			}
		};

		init();
	}, [filterProjects]);

	// Refresh quest status and points when wallet state changes
	useEffect(() => {
		const runCheck = async () => {
			if (isConnected && account) {
				const updated = await projectManager.checkAllProjectsProgress(account);
				setProjectQuests(filterProjects(updated));
				const points = await projectManager.getAllUserPoints(account);
				setUserPoints(filterPoints(points));
			} else {
				projectManager.clearAllProgress();
				setProjectQuests(filterProjects(projectManager.getAllQuests()));
				setUserPoints(filterPoints(new Map()));
			}
		};

		runCheck();
	}, [isConnected, account, filterProjects, filterPoints]);

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
		error,
		account,
		isConnected,
		isConnecting,
		handleConnect,
	}), [
		projectQuests,
		loading,
		userPoints,
		totals,
		error,
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
