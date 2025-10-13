import { MetaMaskProvider } from '@quest-src/hooks/useMetaMask';
import { QuestDataProvider } from './QuestDataProvider';
import ProfileStatsGrid from './ProfileStatsGrid';
import { EarningHistory } from './EarningHistory';
import { ProjectTransactionHistory } from './ProjectTransactionHistory';
import QuestTopBarStats from './QuestTopBarStats';
import { createPortal } from 'react-dom';
import { useEffect, useState, type ReactNode } from 'react';

function QuestTopBarPortal() {
	const [container, setContainer] = useState<HTMLElement | null>(null);

	useEffect(() => {
		setContainer(document.getElementById('quest-topbar-extra'));
	}, []);

	if (!container) return null;
	return createPortal(<QuestTopBarStats />, container);
}

/**
 * Complete profile page component that includes providers and all content
 */
export default function ProfilePage() {
	return (
		<MetaMaskProvider>
			<QuestDataProvider>
				<QuestTopBarPortal />

				{/* STATS GRID */}
				<ProfileStatsGrid />

				{/* EARNING HISTORY */}
				<EarningHistory />

				{/* PROJECT TRANSACTION HISTORY */}
				<ProjectTransactionHistory />
			</QuestDataProvider>
		</MetaMaskProvider>
	);
}