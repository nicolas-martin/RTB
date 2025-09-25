import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
} from 'react';
import { MetaMaskSDK } from '@metamask/sdk';
import { contractService } from '../services/contractService';
import { PLASMA_TESTNET } from '../config/contracts';

// Extend window interface for ethereum
declare global {
	interface Window {
		ethereum?: any;
	}
}

interface MetaMaskContextType {
	account: string | null;
	balance: string;
	isConnecting: boolean;
	isConnected: boolean;
	error: string | null;
	connectWallet: () => Promise<void>;
	disconnectWallet: () => void;
	switchToPlasmaTestnet: () => Promise<void>;
}

const MetaMaskContext = createContext<MetaMaskContextType | undefined>(
	undefined
);

export const useMetaMask = () => {
	const context = useContext(MetaMaskContext);
	if (!context) {
		throw new Error('useMetaMask must be used within MetaMaskProvider');
	}
	return context;
};

interface MetaMaskProviderProps {
	children: ReactNode;
}

export const MetaMaskProvider: React.FC<MetaMaskProviderProps> = ({
	children,
}) => {
	const [account, setAccount] = useState<string | null>(null);
	const [balance, setBalance] = useState<string>('0');
	const [isConnecting, setIsConnecting] = useState(false);
	const [isConnected, setIsConnected] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [sdk, setSDK] = useState<MetaMaskSDK | null>(null);

	useEffect(() => {
		const MMSDK = new MetaMaskSDK({
			dappMetadata: {
				name: 'Ride The Bus',
				url: window.location.origin,
			},
			infuraAPIKey: process.env.INFURA_API_KEY,
			checkInstallationImmediately: false,
			// Add these options to improve connection
			preferDesktop: true,
			openDeeplink: (link) => {
				window.open(link, '_blank');
			},
		});

		setSDK(MMSDK);

		// Give SDK time to initialize before checking connection
		const checkConnection = async () => {
			// Wait a bit for SDK to initialize
			await new Promise(resolve => setTimeout(resolve, 500));

			try {
				const provider = MMSDK.getProvider();
				if (provider) {
					const accounts = await provider.request({
						method: 'eth_accounts',
					});
					if (accounts && Array.isArray(accounts) && accounts.length > 0) {
						handleAccountsChanged(accounts);
					}
				}
			} catch (err) {
				console.error('Failed to check connection:', err);
			}
		};

		checkConnection();
	}, []);

	const handleAccountsChanged = async (
		accounts: string[] | Partial<unknown>
	) => {
		const accountsArray = Array.isArray(accounts) ? accounts : [];
		if (accountsArray.length > 0) {
			const account = accountsArray[0];
			setAccount(account);
			setIsConnected(true);

			// Connect contract service
			await contractService.connectWithProvider();

			// Get balance
			const balance = await contractService.getBalance(account);
			setBalance(balance);

			// Fetch house liquidity and max payout immediately
			try {
				const houseLiquidity = await contractService.getHouseLiquidity();
				const maxPayout = await contractService.getMaxPayout();
				console.log('House liquidity on connect:', houseLiquidity, 'XPL');
				console.log('Max payout on connect:', maxPayout, 'XPL');
			} catch (err) {
				console.error('Error fetching contract info on connect:', err);
			}
		} else {
			setAccount(null);
			setIsConnected(false);
			setBalance('0');
		}
	};

	const connectWallet = async () => {
		if (!sdk) {
			setError('MetaMask SDK not initialized');
			return;
		}

		setIsConnecting(true);
		setError(null);

		try {
			// Try to connect directly first
			await sdk.connect();

			// Give SDK a moment to establish connection
			await new Promise((resolve) => setTimeout(resolve, 500));

			let provider = sdk.getProvider();

			// If provider still not ready, wait and retry
			if (!provider) {
				await new Promise((resolve) => setTimeout(resolve, 1500));
				provider = sdk.getProvider();
			}

			if (!provider) {
				// Try one more time with direct ethereum object
				if (window.ethereum) {
					provider = window.ethereum;
				} else {
					throw new Error('MetaMask not found. Please install MetaMask extension or open in MetaMask mobile browser.');
				}
			}

			// Request account access
			const accounts = await provider.request({
				method: 'eth_requestAccounts',
			});

			if (accounts && Array.isArray(accounts) && accounts.length > 0) {
				await handleAccountsChanged(accounts);

				// Switch to Plasma Testnet
				await switchToPlasmaTestnet();
			}
		} catch (err: any) {
			console.error('Failed to connect wallet:', err);

			// More user-friendly error messages
			if (err.code === 4001) {
				setError('Connection request was rejected');
			} else if (err.message?.includes('provider')) {
				setError('MetaMask is initializing. Please try again.');
			} else if (err.message?.includes('not found')) {
				setError('Please install MetaMask extension or use MetaMask mobile browser');
			} else {
				setError(err.message || 'Failed to connect wallet');
			}
		} finally {
			setIsConnecting(false);
		}
	};

	const disconnectWallet = () => {
		if (sdk) {
			sdk.terminate();
		}
		setAccount(null);
		setIsConnected(false);
		setBalance('0');
		contractService.removeAllListeners();
	};

	const switchToPlasmaTestnet = async () => {
		if (!sdk) {
			setError('MetaMask SDK not initialized');
			return;
		}

		try {
			await contractService.switchToPlasmaTestnet();
			// Refresh balance after network switch
			if (account) {
				const balance = await contractService.getBalance(account);
				setBalance(balance);
			}
		} catch (err: any) {
			console.error('Failed to switch network:', err);
			setError(err.message || 'Failed to switch to Plasma Testnet');
			throw err;
		}
	};

	// Listen for account changes
	useEffect(() => {
		if (!sdk) return;

		const provider = sdk.getProvider();
		if (!provider) return;

		const handleChainChanged = () => {
			// Reload the page on chain change
			window.location.reload();
		};

		provider.on('accountsChanged', handleAccountsChanged);
		provider.on('chainChanged', handleChainChanged);

		return () => {
			provider.removeListener('accountsChanged', handleAccountsChanged);
			provider.removeListener('chainChanged', handleChainChanged);
		};
	}, [sdk]);

	// Update balance periodically
	useEffect(() => {
		if (!account || !isConnected) return;

		const interval = setInterval(async () => {
			try {
				const balance = await contractService.getBalance(account);
				setBalance(balance);
			} catch (err) {
				console.error('Failed to update balance:', err);
			}
		}, 10000); // Update every 10 seconds

		return () => clearInterval(interval);
	}, [account, isConnected]);

	return (
		<MetaMaskContext.Provider
			value={{
				account,
				balance,
				isConnecting,
				isConnected,
				error,
				connectWallet,
				disconnectWallet,
				switchToPlasmaTestnet,
			}}
		>
			{children}
		</MetaMaskContext.Provider>
	);
};
