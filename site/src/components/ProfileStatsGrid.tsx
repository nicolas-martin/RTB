import { useMemo } from 'react';
import { useQuestProgressStore } from '@quest-src/stores/questProgressStore';
import './ProfileStatsGrid.css';

export default function ProfileStatsGrid() {
	// Get global stats from store
	const globalUserPoints = useQuestProgressStore((state) => state.globalUserPoints);
	
	// Calculate total points across all projects
	const totalPoints = useMemo(() => {
		return Array.from(globalUserPoints.values()).reduce((acc, value) => acc + value, 0);
	}, [globalUserPoints]);

	return (
		<div className="stats-grid">
			<div className="stat-card">
				<div className="stat-label">Points Earned</div>
				<div className="stat-value">{totalPoints.toLocaleString()}</div>
			</div>
			<div className="stat-card stat-card-coming-soon">
				<div className="stat-label">USDT Earned</div>
				<div className="stat-value stat-value-coming-soon">Coming soon</div>
			</div>
			<div className="stat-card stat-card-coming-soon">
				<div className="stat-label">XPL Earned</div>
				<div className="stat-value stat-value-coming-soon">Coming soon</div>
			</div>
		</div>
	);
}

