import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { ProjectWithQuests, QuestTotals } from '@quest-src/types/context';

interface QuestFallbackContextValue {
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

const QuestFallbackContext = createContext<QuestFallbackContextValue | null>(null);

interface QuestFallbackProviderProps {
	children: ReactNode;
}

export function QuestFallbackProvider({ children }: QuestFallbackProviderProps) {
	const [projectQuests, setProjectQuests] = useState<ProjectWithQuests[]>([]);
	const [userPoints, setUserPoints] = useState<Map<string, number>>(new Map());
	const [loading, setLoading] = useState<boolean>(true);
	const [account, setAccount] = useState<string | null>(null);
	const [isConnected, setIsConnected] = useState<boolean>(false);
	const [isConnecting, setIsConnecting] = useState<boolean>(false);

	// Mock quest data for when MetaMask is not available
	const mockProjects: ProjectWithQuests[] = [
		{
			project: {
				id: 'gluex',
				name: 'GlueX',
				description: 'Decentralized exchange on Plasma',
				graphqlEndpoint: '',
			},
			quests: [
				{
					id: 'swap_1_usdt0_to_xpl',
					name: 'First Swap',
					description: 'Make your first swap on GlueX',
					type: 'custom',
					reward: 100,
					completed: false,
					progress: undefined,
				},
				{
					id: 'swap_volume_usdt0_20',
					name: 'Volume Trader',
					description: 'Trade $20 worth of USDT0',
					type: 'progress',
					reward: 200,
					completed: false,
					progress: 0,
				},
			],
		},
		{
			project: {
				id: 'rtb',
				name: 'Ride The Bus',
				description: 'Gambling game on Plasma',
				graphqlEndpoint: '',
			},
			quests: [
				{
					id: 'win_1_game',
					name: 'First Win',
					description: 'Win your first game',
					type: 'custom',
					reward: 150,
					completed: false,
					progress: undefined,
				},
				{
					id: 'play_10_games',
					name: 'Regular Player',
					description: 'Play 10 games',
					type: 'progress',
					reward: 300,
					completed: false,
					progress: 0,
				},
			],
		},
	];

	useEffect(() => {
		// Simulate loading
		const timer = setTimeout(() => {
			setProjectQuests(mockProjects);
			setUserPoints(new Map([
				['gluex', 0],
				['rtb', 0],
			]));
			setLoading(false);
		}, 500);

		// Check if already connected to MetaMask
		const checkExistingConnection = async () => {
			if (window.ethereum && window.ethereum.isMetaMask) {
				try {
					const accounts = await window.ethereum.request({
						method: 'eth_accounts'
					});
					if (accounts && accounts.length > 0) {
						setAccount(accounts[0]);
						setIsConnected(true);
					}
				} catch (error) {
					console.warn('Failed to check existing MetaMask connection:', error);
				}
			}
		};

		checkExistingConnection();

		return () => clearTimeout(timer);
	}, []);

	const totals: QuestTotals = {
		totalQuests: projectQuests.reduce((acc, item) => acc + item.quests.length, 0),
		completed: projectQuests.reduce((acc, item) => acc + item.quests.filter(quest => quest.completed).length, 0),
		completionPct: 0,
		points: Array.from(userPoints.values()).reduce((acc, value) => acc + value, 0),
	};

	const handleConnect = async () => {
		if (isConnecting) return;
		
		setIsConnecting(true);
		
		try {
			// Try to connect to MetaMask if available
			if (window.ethereum && window.ethereum.isMetaMask) {
				const accounts = await window.ethereum.request({
					method: 'eth_requestAccounts',
				});
				if (accounts && accounts.length > 0) {
					// Update the state to show connected
					setAccount(accounts[0]);
					setIsConnected(true);
					console.log('Connected to MetaMask:', accounts[0]);
				}
			} else {
				// MetaMask not available
				console.log('MetaMask not available - using fallback mode');
			}
		} catch (error) {
			console.warn('Failed to connect to MetaMask:', error);
		} finally {
			setIsConnecting(false);
		}
	};

	const value: QuestFallbackContextValue = {
		projectQuests,
		loading,
		userPoints,
		totals,
		error: null,
		account,
		isConnected,
		isConnecting,
		handleConnect,
	};

	return <QuestFallbackContext.Provider value={value}>{children}</QuestFallbackContext.Provider>;
}

export function useQuestFallbackData(): QuestFallbackContextValue {
	const context = useContext(QuestFallbackContext);
	if (!context) {
		throw new Error('useQuestFallbackData must be used within a QuestFallbackProvider');
	}
	return context;
}
