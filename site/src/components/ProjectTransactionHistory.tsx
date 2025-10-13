import { useEffect, useState } from 'react';
import { useQuestData } from './QuestDataProvider';
import { useQuestProgressStore } from '@quest-src/stores/questProgressStore';
import { PARTNER_APP_IDS } from '../lib/quest/constants';
import './ProjectTransactionHistory.css';

export function ProjectTransactionHistory() {
	const { account, isConnected } = useQuestData();
	const transactionHistory = useQuestProgressStore((state) => state.transactionHistory);
	const loading = useQuestProgressStore((state) => state.transactionHistoryLoading);
	const loadTransactionHistory = useQuestProgressStore((state) => state.loadTransactionHistory);
	const [selectedProject, setSelectedProject] = useState<string>('all');

	// Fetch transaction data for the selected project(s)
	useEffect(() => {
		if (!isConnected || !account) {
			return;
		}

		// Load transaction history when account is connected or project selection changes
		loadTransactionHistory(account, selectedProject);
	}, [account, isConnected, selectedProject, loadTransactionHistory]);

	if (!isConnected || !account) {
		return (
			<div className="project-transaction-history">
				<h2 className="history-title">Project Transaction History</h2>
				<div className="history-empty">
					<p>Connect your wallet to view your transaction history</p>
				</div>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="project-transaction-history">
				<h2 className="history-title">Project Transaction History</h2>
				<div className="history-loading">
					<p>Loading...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="project-transaction-history">
			<div className="history-header">
				<h2 className="history-title">Project Transaction History</h2>
				<select
					className="project-selector"
					value={selectedProject}
					onChange={(e) => setSelectedProject(e.target.value)}
				>
					<option value="all">All Projects</option>
					{PARTNER_APP_IDS.map(projectId => (
						<option key={projectId} value={projectId}>
							{formatProjectName(projectId)}
						</option>
					))}
				</select>
			</div>

			{transactionHistory.length === 0 ? (
				<div className="history-empty">
					<div className="transaction-placeholder">
						<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
							<path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
							<path d="M9 12h6m-6 4h6" />
						</svg>
						<p className="placeholder-text">No recent transactions</p>
						<p className="placeholder-subtext">Your activity will appear here</p>
					</div>
				</div>
			) : (
				<div className="transaction-table-container">
					<table className="transaction-table">
						<thead>
							<tr>
								<th>Timestamp</th>
								<th>Project</th>
								<th>Type</th>
								<th>Amount</th>
								<th>Points Earned</th>
								<th>Transaction</th>
							</tr>
						</thead>
						<tbody>
							{transactionHistory.map((tx, idx) => (
								<tr key={idx}>
									<td>{formatTimestamp(tx.timestamp)}</td>
									<td className="project-name">{formatProjectName(tx.projectId)}</td>
									<td className="transaction-type">{formatTransactionType(tx.transaction_type)}</td>
									<td className="transaction-amount">{formatAmount(tx.amount)}</td>
									<td className="points-earned">{tx.points_earned}</td>
									<td className="transaction-hash">
										{tx.transactionHash ? (
											<a
												href={`https://plasmascan.to/tx/${tx.transactionHash}`}
												target="_blank"
												rel="noopener noreferrer"
												className="tx-link"
											>
												{formatTransactionHash(tx.transactionHash)}
											</a>
										) : (
											'—'
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}

// Format timestamp to readable date
function formatTimestamp(timestamp: string): string {
	const date = new Date(parseInt(timestamp) * 1000);
	return date.toLocaleString();
}

// Format project name for display
function formatProjectName(projectId?: string): string {
	if (!projectId) return '—';

	const names: Record<string, string> = {
		'aave': 'Aave',
		'gluex': 'GlueX',
		'fluid': 'Fluid',
		'rtb': 'Ride The Bus'
	};

	return names[projectId] || projectId.toUpperCase();
}

// Format transaction type for display
function formatTransactionType(type: string): string {
	return type
		.replace(/_/g, ' ')
		.split(' ')
		.map(word => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

// Format amount (assuming 6 decimals)
function formatAmount(amount: string): string {
	const num = parseFloat(amount) / 1e6;
	return num.toFixed(2);
}

// Format transaction hash for display (show first 6 and last 4 characters)
function formatTransactionHash(hash: string): string {
	if (hash.length <= 10) return hash;
	return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}
