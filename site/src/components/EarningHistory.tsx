import { useEffect } from 'react';
import { useQuestData } from './QuestDataProvider';
import { useQuestProgressStore } from '@quest-src/stores/questProgressStore';
import './EarningHistory.css';

export function EarningHistory() {
	const { account, isConnected } = useQuestData();
	const earningHistory = useQuestProgressStore((state) => state.earningHistory);
	const loading = useQuestProgressStore((state) => state.earningHistoryLoading);
	const loadEarningHistory = useQuestProgressStore((state) => state.loadEarningHistory);

	useEffect(() => {
		if (!isConnected || !account) {
			return;
		}

		// Load earning history when account is connected
		loadEarningHistory(account);
	}, [account, isConnected, loadEarningHistory]);

	if (!isConnected || !account) {
		return (
			<div className="earning-history">
				<h2 className="history-title">Earning History</h2>
				<div className="history-empty">
					<p>Connect your wallet to view your earning history</p>
				</div>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="earning-history">
				<h2 className="history-title">Earning History</h2>
				<div className="history-loading">
					<p>Loading...</p>
				</div>
			</div>
		);
	}

	if (earningHistory.length === 0) {
		return (
			<div className="earning-history">
				<h2 className="history-title">Earning History</h2>
				<div className="history-empty">
					<p>No completed quests yet. Start completing quests to earn points!</p>
				</div>
			</div>
		);
	}

	return (
		<div className="earning-history">
			<h2 className="history-title">Earning History</h2>
			<table className="history-table">
				<thead>
					<tr>
						<th>Timestamp</th>
						<th>Reward Amount</th>
						<th>Quest Title</th>
						<th>Project</th>
					</tr>
				</thead>
				<tbody>
					{earningHistory.map((completion, idx) => (
						<tr key={`${completion.project_id}-${completion.quest_id}-${idx}`}>
							<td>{new Date(completion.completed_at).toLocaleString()}</td>
							<td className="reward-amount">+{completion.points_earned.toLocaleString()} Points</td>
							<td className="quest-title">{completion.quest_title}</td>
							<td className="project-name">{completion.project_id.toUpperCase()}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
