import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SiweMessage } from 'siwe';
import { getAddress } from 'viem';

interface AuthContextType {
  account: string | null;
  isConnected: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  connectWallet: () => Promise<void>;
  authenticate: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if wallet is already connected
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const provider = window.ethereum;
        if (provider) {
          const accounts = await provider.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            setAccount(accounts[0]);
          }
        }
      } catch (err) {
        console.error('Failed to check connection:', err);
      }
    };

    checkConnection();

    // Listen for account changes
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          setAccount(null);
          setIsAuthenticated(false);
        } else {
          setAccount(accounts[0]);
          setIsAuthenticated(false); // Reset auth when account changes
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);

      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, []);

  const connectWallet = async () => {
    try {
      setIsLoading(true);
      const provider = window.ethereum;
      if (!provider) throw new Error('MetaMask not installed');

      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const authenticate = async () => {
    if (!account) return;

    try {
      setIsLoading(true);

      // Convert address to EIP-55 checksum format
      const checksumAddress = getAddress(account);

      // Get current chain ID from MetaMask
      const provider = window.ethereum;
      if (!provider) throw new Error('MetaMask not found');

      const chainId = await provider.request({ method: 'eth_chainId' });
      const chainIdNumber = parseInt(chainId, 16);

      const message = new SiweMessage({
        domain: window.location.host,
        address: checksumAddress,
        statement: 'Sign in to interact with Plasma Dashboard',
        uri: window.location.origin,
        version: '1',
        chainId: chainIdNumber,
        nonce: Math.random().toString(36).substring(2, 10), // 8 character alphanumeric nonce
      });

      const messageToSign = message.prepareMessage();

      const signature = await provider.request({
        method: 'personal_sign',
        params: [messageToSign, checksumAddress],
      });

      await message.verify({ signature });

      setIsAuthenticated(true);
    } catch (error) {
      console.error('Authentication failed:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        account,
        isConnected: !!account,
        isAuthenticated,
        isLoading,
        connectWallet,
        authenticate
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
