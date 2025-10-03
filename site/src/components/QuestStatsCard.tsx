import QuestProgressDonut from './QuestProgressDonut';

interface QuestStatsCardProps {
	completed: number;
	total: number;
	points: number;
}

const formatNumber = (num: number): string => {
	if (num >= 1000000) {
		return (num / 1000000).toFixed(1) + 'M';
	}
	if (num >= 1000) {
		return (num / 1000).toFixed(1) + 'K';
	}
	return num.toString();
};

export default function QuestStatsCard({ completed, total, points }: QuestStatsCardProps) {
	return (
		<div className="quest-stats-card">
			<div className="quest-stats-content">
				<div className="quest-stats-donut">
					<QuestProgressDonut completed={completed} total={total} size={80} />
				</div>
				<div className="quest-stats-info">
					<div className="quest-stat-item">
						<span className="quest-stat-label">Points</span>
						<span className="quest-stat-value">{formatNumber(points)}</span>
					</div>
					<div className="quest-stat-item">
						<span className="quest-stat-label">Completed</span>
						<span className="quest-stat-value">{completed}/{total}</span>
					</div>
				</div>
			</div>
		</div>
	);
}

