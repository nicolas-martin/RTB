import { useEffect, useMemo, useState } from 'react';
import type { Quest } from '@quest-src/types/quest';
import type { ProjectMetadata } from '@quest-src/types/quest';
import { projectManager } from '@quest-src/services/projectManager';
import { useMetaMask } from '@quest-src/hooks/useMetaMask';
import './QuestDashboard.css';

interface ProjectWithQuests {
	project: ProjectMetadata;
	quests: Quest[];
}

const gradientByType: Record<string, string> = {
	conditional: 'linear-gradient(135deg, rgba(93,91,255,0.24), rgba(93,186,255,0.12))',
	progress: 'linear-gradient(135deg, rgba(255,142,53,0.26), rgba(255,53,120,0.12))',
	custom: 'linear-gradient(135deg, rgba(86,255,184,0.24), rgba(86,133,255,0.12))'
};

export default function QuestDashboard() {
	const [projectQuests, setProjectQuests] = useState<ProjectWithQuests[]>([]);
	const [loading, setLoading] = useState(true);
	const [userPoints, setUserPoints] = useState<Map<string, number>>(new Map());
	const [activeFilter, setActiveFilter] = useState<string>('all');

	const {
		account,
		isConnected,
		isConnecting,
		error,
		connectWallet,
		disconnectWallet
	} = useMetaMask();

	useEffect(() => {
		const init = async () => {
			try {
				await projectManager.loadAllProjects();
				const all = projectManager.getAllQuests();
				setProjectQuests(all);
			} finally {
				setLoading(false);
			}
		};

		init();
	}, []);

	useEffect(() => {
		const runCheck = async () => {
			if (isConnected && account) {
				const updated = await projectManager.checkAllProjectsProgress(account);
				setProjectQuests(updated);
				const points = await projectManager.getAllUserPoints(account);
				setUserPoints(points);
			} else {
				projectManager.clearAllProgress();
				setProjectQuests(projectManager.getAllQuests());
				setUserPoints(new Map());
			}
		};

		runCheck();
	}, [isConnected, account]);

	const totals = useMemo(() => {
		const totalQuests = projectQuests.reduce((acc, item) => acc + item.quests.length, 0);
		const completed = projectQuests.reduce(
			(acc, item) => acc + item.quests.filter((quest) => quest.completed).length,
			0
		);
		const points = Array.from(userPoints.values()).reduce((acc, value) => acc + value, 0);

		return {
			totalQuests,
			completed,
			completionPct: totalQuests ? Math.round((completed / totalQuests) * 100) : 0,
			points
		};
	}, [projectQuests, userPoints]);

	const filters = useMemo(() => {
		const types = new Set<string>();
		projectQuests.forEach(({ quests }) => {
			quests.forEach((quest) => types.add(quest.type));
		});
		return ['all', ...Array.from(types)];
	}, [projectQuests]);

	const filteredProjects = useMemo(() => {
		if (activeFilter === 'all') return projectQuests;

		return projectQuests
			.map((entry) => ({
				...entry,
				quests: entry.quests.filter((quest) => quest.type === activeFilter)
			}))
			.filter((entry) => entry.quests.length > 0);
	}, [projectQuests, activeFilter]);

	const handleConnect = async () => {
		if (isConnected) {
			await disconnectWallet();
			return;
		}

		await connectWallet();
	};

	return (
		<div className="quest-screen">
			<section className="toolbar">
				<div className="stats-grid">
					<div className="stat-card">
						<span className="stat-label">Total Points</span>
						<span className="stat-value">{totals.points.toLocaleString()}</span>
						{isConnected && account && (
							<span className="stat-subtext">Across {userPoints.size} projects</span>
						)}
					</div>
					<div className="stat-card">
						<span className="stat-label">Completion</span>
						<span className="stat-value">{totals.completionPct}%</span>
						<span className="stat-subtext">
							{totals.completed} / {totals.totalQuests} quests
						</span>
					</div>
					<div className="stat-card">
						<span className="stat-label">Wallet</span>
						<button className="wallet-button" onClick={handleConnect} disabled={isConnecting}>
							{isConnecting ? 'Connecting…' : isConnected ? 'Disconnect' : 'Connect MetaMask'}
						</button>
						<span className="stat-subtext wallet">
							{isConnected && account ? `${account.slice(0, 6)}…${account.slice(-4)}` : 'Not connected'}
						</span>
					</div>
				</div>
				{error && <p className="error-banner">{error}</p>}
			</section>

			<section className="filter-row">
				<div className="filter-group">
					{filters.map((filter) => (
						<button
							key={filter}
							type="button"
							className={['filter-pill', activeFilter === filter ? 'active' : ''].join(' ')}
							onClick={() => setActiveFilter(filter)}
						>
							{filter === 'all' ? 'All quests' : filter}
						</button>
					))}
				</div>
			</section>

			<section className="projects-grid">
				{loading && (
					<div className="loading-card">Loading quests…</div>
				)}

				{!loading && filteredProjects.length === 0 && (
					<div className="empty-card">No quests match this filter yet.</div>
				)}

				{filteredProjects.map(({ project, quests }) => (
					<article className="project-card" key={project.id}>
						<header>
							<div>
								<h2>{project.name}</h2>
								<p>{project.description}</p>
							</div>
							<div className="project-meta">
								<div>
									<span className="meta-label">Available</span>
									<span className="meta-value">{quests.filter((quest) => !quest.completed).length}</span>
								</div>
								<div>
									<span className="meta-label">Completed</span>
									<span className="meta-value">
										{quests.filter((quest) => quest.completed).length}
									</span>
								</div>
							</div>
						</header>
						<div className="quest-grid">
							{quests.map((quest) => {
								const completedClass = quest.completed ? 'completed' : '';
								const gradient = gradientByType[quest.type] ?? gradientByType.custom;
								const progress = quest.progress ?? 0;
								const showProgress = quest.type !== 'conditional';

								return (
									<div className={['quest-tile', completedClass].join(' ')} key={quest.id} style={{ background: gradient }}>
										<div className="tile-header">
											<span className="pill">{quest.type}</span>
											<span className="reward">🪙 {quest.reward}</span>
										</div>
										<h3>{quest.title}</h3>
										<p>{quest.description}</p>
										{showProgress && (
											<div className="progress-track">
												<div
													className="progress-fill"
													style={{ width: `${Math.min(progress, 100)}%` }}
												/>
											</div>
										)}
										<footer>
											{quest.completed ? (
												<span className="status complete">Completed</span>
											) : showProgress ? (
												<span className="status upcoming">{Math.round(progress)}% complete</span>
											) : (
												<span className="status upcoming">Pending validation</span>
											)}
										</footer>
									</div>
								);
							})}
						</div>
					</article>
				))}
			</section>
		</div>
	);
}
