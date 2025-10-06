import { MetaMaskProvider } from '@quest-src/hooks/useMetaMask';
import { QuestDataProvider } from './QuestDataProvider';
import { EarningHistory } from './EarningHistory';

/**
 * Wrapper component that ensures EarningHistory has access to QuestProvider context.
 * Uses MetaMaskProvider + QuestDataProvider directly without rendering the top bar portal.
 * Must be rendered with client:only to avoid SSR context issues.
 */
export function ProfileEarningHistory() {
	return (
		<MetaMaskProvider>
			<QuestDataProvider>
				<EarningHistory />
			</QuestDataProvider>
		</MetaMaskProvider>
	);
}
