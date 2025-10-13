import { MetaMaskProvider } from '@quest-src/hooks/useMetaMask';
import { QuestDataProvider } from './QuestDataProvider';
import { ProjectTransactionHistory } from './ProjectTransactionHistory';

/**
 * Wrapper component that ensures ProjectTransactionHistory has access to QuestProvider context.
 * Uses MetaMaskProvider + QuestDataProvider directly without rendering the top bar portal.
 * Must be rendered with client:only to avoid SSR context issues.
 */
export function ProfileTransactionHistory() {
	return (
		<MetaMaskProvider>
			<QuestDataProvider>
				<ProjectTransactionHistory />
			</QuestDataProvider>
		</MetaMaskProvider>
	);
}
