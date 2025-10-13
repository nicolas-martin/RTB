import { useState, useEffect, createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import { MetaMaskSDK } from '@metamask/sdk'
import { TEST_WALLET_ADDRESS } from '../constants'

interface MetaMaskContextType {
	account: string | null
	isConnected: boolean
	isConnecting: boolean
	error: string | null
	connectWallet: () => Promise<void>
	disconnectWallet: () => Promise<void>
}

const MetaMaskContext = createContext<MetaMaskContextType | undefined>(undefined)

let sdkInstance: MetaMaskSDK | null = null

export const MetaMaskProvider = ({ children }: { children: ReactNode }) => {
	const [account, setAccount] = useState<string | null>(null)
	const [isConnecting, setIsConnecting] = useState(false)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		// Check for test mode via URL parameter or development environment
		const useTestWallet = false;

		if (useTestWallet) {
			console.log('[MetaMask] Using test wallet:', TEST_WALLET_ADDRESS);
			setAccount(TEST_WALLET_ADDRESS);
			return; // Skip MetaMask initialization in test mode
		}

		// Initialize SDK only once
		if (!sdkInstance) {
			sdkInstance = new MetaMaskSDK({
				dappMetadata: {
					name: 'Quest System',
					url: window.location.origin,
				},
				checkInstallationImmediately: false,
				shouldShimWeb3: false,
			})
		}

		// Check if already connected - use window.ethereum directly for instant detection
		const checkConnection = async () => {
			try {
				// Try window.ethereum first (instant for browser extension)
				const provider = window.ethereum || sdkInstance?.getProvider()

				if (provider) {
					const accounts = await provider.request({
						method: 'eth_accounts'
					})
					if (accounts && accounts.length > 0) {
						setAccount(accounts[0] || null)
					}
				}
			} catch (err) {
				console.error('Failed to check connection:', err)
			}
		}

		checkConnection()

		// Set up account change listener
		const provider = sdkInstance?.getProvider()
		if (provider) {
			const handleAccountsChanged = (accounts: unknown) => {
				const accountsArray = accounts as string[]
				if (accountsArray.length === 0) {
					setAccount(null)
				} else {
					setAccount(accountsArray[0] || null)
				}
			}

			provider.on('accountsChanged', handleAccountsChanged)

			return () => {
				if ('removeListener' in provider && typeof provider.removeListener === 'function') {
					provider.removeListener('accountsChanged', handleAccountsChanged)
				}
			}
		}
	}, [])

	const connectWallet = async () => {
		setIsConnecting(true)
		setError(null)

		try {
			// Use window.ethereum directly for more reliable connection
			const provider = window.ethereum || sdkInstance?.getProvider()

			if (!provider) {
				throw new Error('MetaMask is not installed')
			}

			const accounts = await provider.request({
				method: 'eth_requestAccounts',
			})

			if (accounts && accounts.length > 0) {
				setAccount(accounts[0] || null)
			}
		} catch (err: any) {
			if (err.code === 4001) {
				setError('Connection rejected by user')
			} else {
				setError(err.message || 'Failed to connect wallet')
			}
			console.error('Failed to connect:', err)
		} finally {
			setIsConnecting(false)
		}
	}

	const disconnectWallet = async () => {
		try {
			// Just clear the account state - don't terminate the SDK
			// This allows reconnection without page refresh
			setAccount(null)
		} catch (err) {
			console.error('Failed to disconnect:', err)
		}
	}

	return (
		<MetaMaskContext.Provider
			value={{
				account,
				isConnected: !!account,
				isConnecting,
				error,
				connectWallet,
				disconnectWallet,
			}}
		>
			{children}
		</MetaMaskContext.Provider>
	)
}

export const useMetaMask = () => {
	const context = useContext(MetaMaskContext)
	if (context === undefined) {
		throw new Error('useMetaMask must be used within a MetaMaskProvider')
	}
	return context
}
