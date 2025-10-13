import { useState, useMemo } from 'react';
import type { Quest } from '@quest-src/types/quest';

interface QuestListSectionProps {
	quests: Quest[];
	loading: boolean;
	points?: number;
	completed?: number;
	total?: number;
}

export default function QuestListSection({ quests, loading, points = 0, completed = 0, total = 0 }: QuestListSectionProps) {
	const [activeFilter, setActiveFilter] = useState<string>('all');

	const filters = useMemo(() => {
		return ['all', 'activity'];
	}, []);

	const filteredQuests = useMemo(() => {
		if (activeFilter === 'all') return quests;
		return quests.filter((quest) => quest.type === activeFilter);
	}, [quests, activeFilter]);

	if (loading) {
		return (
			<div className="quest-list-section">
				<div className="quest-list-loading">Loading quests...</div>
			</div>
		);
	}

	return (
		<div className="quest-list-section">
			{/* Stats and Quest Type Filters */}
			<div className="quest-filters-container">
				{/* Stats Pills - Left Side */}
				<div className="quest-stats-pills">
					<div className="quest-stat-pill">
						<span className="quest-stat-pill-label">Points</span>
						<span className="quest-stat-pill-value">{points.toLocaleString()}</span>
					</div>
				</div>

				{/* Quest Type Filters - Right Side */}
				<div className="quest-filters">
					{filters.map((filter) => (
						<button
							key={filter}
							className={`quest-filter ${activeFilter === filter ? 'active' : ''}`}
							onClick={() => setActiveFilter(filter)}
						>
							{filter === 'all' ? 'Offers' : filter === 'activity' ? 'Activity' : filter}
						</button>
					))}
				</div>
			</div>

			{/* Quest List or Activity Table */}
			{activeFilter === 'activity' ? (
				<div className="activity-table-container">
					<table className="activity-table">
						<thead>
							<tr>
								<th>Timestamp</th>
								<th>Rewards Amount</th>
								<th>Tx Type</th>
								<th>Tx Amount</th>
								<th>Tx Hash</th>
							</tr>
						</thead>
						<tbody>
							{/* Placeholder row - will be populated by API later */}
							<tr className="activity-table-empty">
								<td colSpan={5}>No activity yet</td>
							</tr>
						</tbody>
					</table>
				</div>
			) : (
				<div className="quest-list">
					{filteredQuests.map((quest) => (
						<div key={quest.id} className={`quest-item ${quest.completed ? 'completed' : ''}`}>
							<div className="quest-item-header">
								<h3 className="quest-item-title">{quest.title}</h3>
								<div className="quest-item-meta">
									<span className="quest-item-reward">+{quest.reward} pts</span>
								</div>
							</div>
							{quest.description && (
								<p className="quest-item-description">{quest.description}</p>
							)}
							{quest.progress !== undefined && (
								<div className="quest-item-progress">
									<div className="quest-progress-bar">
										<div 
											className="quest-progress-fill" 
											style={{ width: `${quest.progress}%` }}
										/>
									</div>
								</div>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	);
}
