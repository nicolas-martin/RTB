import { useEffect, useState } from 'react';
import { useQuestData } from './QuestDataProvider';
import { questApiClient } from '@quest-src/services/questApiClient';
import { QUEST_PROJECT_IDS } from '@quest-src/services/projectManager';
import type { Quest } from '@quest-src/types/quest';
import './EarningHistory.css';

interface QuestCompletion {
	quest_id: string;
	project_id: string;
	quest_title: string;
	points_earned: number;
	completed_at: string;
}

export function EarningHistory() {
	const { account, isConnected } = useQuestData();
	const [completions, setCompletions] = useState<QuestCompletion[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function fetchHistory() {
			if (!isConnected || !account) {
				setCompletions([]);
				setLoading(false);
				return;
			}

			setLoading(true);
			setError(null);

			try {
				console.log('[EarningHistory] Fetching earning history for:', account);
				const allCompletions: QuestCompletion[] = [];

				// Fetch progress and quest metadata for each project
				for (const projectId of QUEST_PROJECT_IDS) {
					try {
						// Get quest metadata
						const quests = await questApiClient.getQuests(projectId);
						const questMap = new Map<string, Quest>(quests.map(q => [q.id, q]));

						// Get progress data
						const progressData = await questApiClient.getCachedProgress(account, projectId);

						// Filter for completed quests only
						const completed = progressData
							.filter(p => p.completed && p.completed_at)
							.map(p => ({
								quest_id: p.quest_id,
								project_id: projectId,
								quest_title: questMap.get(p.quest_id)?.title || p.quest_id,
								points_earned: p.points_earned,
								completed_at: p.completed_at!,
							}));

						allCompletions.push(...completed);
					} catch (err) {
						console.error(`[EarningHistory] Failed to fetch data for ${projectId}:`, err);
					}
				}

				// Sort by completion date (newest first)
				allCompletions.sort((a, b) =>
					new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
				);

				console.log('[EarningHistory] Found', allCompletions.length, 'completed quests');
				setCompletions(allCompletions);
			} catch (err) {
				console.error('[EarningHistory] Error fetching history:', err);
				setError(err instanceof Error ? err.message : 'Failed to load earning history');
			} finally {
				setLoading(false);
			}
		}

		fetchHistory();
	}, [account, isConnected]);

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

	if (error) {
		return (
			<div className="earning-history">
				<h2 className="history-title">Earning History</h2>
				<div className="history-error">
					<p>Error: {error}</p>
				</div>
			</div>
		);
	}

	if (completions.length === 0) {
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
					{completions.map((completion, idx) => (
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
