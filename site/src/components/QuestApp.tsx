import QuestDashboard from './QuestDashboard';
import { MetaMaskProvider } from '@quest-src/hooks/useMetaMask';

export default function QuestApp() {
	return (
		<MetaMaskProvider>
			<QuestDashboard />
		</MetaMaskProvider>
	);
}
