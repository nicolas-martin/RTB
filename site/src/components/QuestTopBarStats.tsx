import { useQuestData } from './QuestDataProvider';
import './QuestTopBarStats.css';

export default function QuestTopBarStats() {
	const {
		projectQuests,
		totals,
		userPoints,
		account,
		isConnected,
		isConnecting,
		handleConnect,
		error,
	} = useQuestData();

	// const pointProjects = userPoints.size;
	// const projectCount = pointProjects > 0 ? pointProjects : projectQuests.length;
	const formattedAccount =
		isConnected && account ? `${account.slice(0, 6)}…${account.slice(-4)}` : 'Not connected';
	// const projectCountLabel = projectCount === 1 ? '1 project' : `${projectCount} projects`;
	// const hasProjectCount = projectCount > 0;

	return (
		<div className="topbar-stats" role="presentation">
			<div className="topbar-item">
				<span className="topbar-label">Points</span>
				<span className="topbar-value">{totals.points.toLocaleString()}</span>
			</div>
			<div className="topbar-item">
				<span className="topbar-label">Completion</span>
				<span className="topbar-meta">{totals.completed}/{totals.totalQuests} </span>
			</div>
			<div className="topbar-item topbar-wallet">
				<button
					className="topbar-wallet-button"
					onClick={handleConnect}
					disabled={isConnecting}
				>
					{isConnecting ? 'Connecting…' : isConnected ? 'Disconnect' : 'Connect Wallet'}
				</button>
				<span className="topbar-meta wallet">{formattedAccount}</span>
				{error && <span className="topbar-error">{error}</span>}
			</div>
		</div>
	);
}
