import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import QuestDashboard from './QuestDashboard';
import { MetaMaskProvider } from '@quest-src/hooks/useMetaMask';
import { QuestDataProvider } from './QuestDataProvider';
import QuestTopBarStats from './QuestTopBarStats';
import './QuestApp.css';

export default function QuestApp() {
	const [headerContainer, setHeaderContainer] = useState<HTMLElement | null>(null);

	useEffect(() => {
		setHeaderContainer(document.getElementById('quest-topbar-extra'));
	}, []);

	return (
		<MetaMaskProvider>
			<QuestDataProvider>
				{headerContainer && createPortal(<QuestTopBarStats />, headerContainer)}
				<div className="quest-page">
					<section className="hero">
						<div>
							<h1>Complete quests. Earn rewards.</h1>
							<p>
								Connect your wallet to sync quest progress across Plasma dApps and follow a guided
								path through the ecosystem.
							</p>
						</div>
					</section>
					<QuestDashboard />
				</div>
			</QuestDataProvider>
		</MetaMaskProvider>
	);
}
