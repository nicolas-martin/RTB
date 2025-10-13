import ProfileStatsGrid from './ProfileStatsGrid';
import { EarningHistory } from './EarningHistory';
import { ProjectTransactionHistory } from './ProjectTransactionHistory';

/**
 * Profile page content wrapper that ensures all components
 * share the same React context tree
 */
export default function ProfilePageContent() {
	return (
		<>
			{/* STATS GRID */}
			<ProfileStatsGrid />

			{/* EARNING HISTORY */}
			<EarningHistory />

			{/* PROJECT TRANSACTION HISTORY */}
			<ProjectTransactionHistory />
		</>
	);
}