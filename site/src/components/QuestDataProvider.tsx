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
import { projectManager } from '@quest-src/services/projectManager';
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

export function QuestDataProvider({ children }: { children: ReactNode }) {
	const [projectQuests, setProjectQuests] = useState<ProjectWithQuests[]>([]);
	const [loading, setLoading] = useState(true);
	const [userPoints, setUserPoints] = useState<Map<string, number>>(new Map());

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
				setProjectQuests(all);
			} finally {
				setLoading(false);
			}
		};

		init();
	}, []);

	// Refresh quest status and points when wallet state changes
	useEffect(() => {
		const runCheck = async () => {
			if (isConnected && account) {
				const updated = await projectManager.checkAllProjectsProgress(account);
				setProjectQuests(updated);
				const points = await projectManager.getAllUserPoints(account);
				setUserPoints(points);
			} else {
				projectManager.clearAllProgress();
				setProjectQuests(projectManager.getAllQuests());
				setUserPoints(new Map());
			}
		};

		runCheck();
	}, [isConnected, account]);

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
