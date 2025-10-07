import { useMemo, useState, useEffect } from 'react';
import type { ProjectWithQuests } from '@quest-src/types/context';
import { useQuestData } from './QuestDataProvider';
import QuestProgressDonut from './QuestProgressDonut';
import './QuestDashboard.css';

const gradientByType: Record<string, string> = {
	conditional: 'linear-gradient(135deg, rgba(120, 116, 255, 0.32), rgba(64, 196, 255, 0.18))',
	progress: 'linear-gradient(135deg, rgba(255, 170, 92, 0.34), rgba(255, 94, 150, 0.18))',
	custom: 'linear-gradient(135deg, rgba(110, 255, 208, 0.32), rgba(112, 164, 255, 0.18))',
};

const formatNumber = (value: number) => new Intl.NumberFormat().format(value);

// Countdown hook
function useCountdown(targetDate: Date) {
	const [timeLeft, setTimeLeft] = useState({
		days: 0,
		hours: 0,
		minutes: 0,
		seconds: 0,
	});

	useEffect(() => {
		const timer = setInterval(() => {
			const now = new Date().getTime();
			const distance = targetDate.getTime() - now;

			if (distance > 0) {
				const days = Math.floor(distance / (1000 * 60 * 60 * 24));
				const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
				const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
				const seconds = Math.floor((distance % (1000 * 60)) / 1000);

				setTimeLeft({ days, hours, minutes, seconds });
			} else {
				setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
			}
		}, 1000);

		return () => clearInterval(timer);
	}, [targetDate]);

	return timeLeft;
}

// Animated points hook
function useAnimatedPoints(targetPoints: number) {
	const [displayedPoints, setDisplayedPoints] = useState(0);
	const [isAnimating, setIsAnimating] = useState(false);

	useEffect(() => {
		if (targetPoints === 0) return;
		
		setIsAnimating(true);
		const duration = 900; // 2 seconds
		const startTime = Date.now();
		const startPoints = 0;
		
		const animate = () => {
			const elapsed = Date.now() - startTime;
			const progress = Math.min(elapsed / duration, 1);
			
			// Easing function for smooth slowdown near the end
			const easeOutCubic = 1 - Math.pow(1 - progress, 3);
			
			const currentPoints = Math.floor(startPoints + (targetPoints - startPoints) * easeOutCubic);
			setDisplayedPoints(currentPoints);
			
			if (progress < 1) {
				requestAnimationFrame(animate);
			} else {
				setDisplayedPoints(targetPoints);
				setIsAnimating(false);
			}
		};
		
		requestAnimationFrame(animate);
	}, [targetPoints]);

	return { displayedPoints, isAnimating };
}

function QuestProjectGrid({
	projects,
	userPoints,
	loading,
}: {
	projects: ProjectWithQuests[];
	userPoints: Map<string, number>;
	loading: boolean;
}) {
	if (loading && projects.length === 0) {
		return <div className="loading-card">Loading quests…</div>;
	}

	if (!loading && projects.length === 0) {
		return <div className="empty-card">Quest-enabled apps will appear here soon.</div>;
	}

		const baseUrl = import.meta.env.BASE_URL ?? '/';
		const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

		return (
			<div className="overview-grid">
				{projects.map(({ project, quests }) => {
					const completed = quests.filter((quest) => quest.completed).length;
					const total = quests.length;
					const points = userPoints.get(project.id) ?? 0;
					const projectHref = `${normalizedBase}quest/${project.id}`;

					return (
						<a className="overview-card" key={project.id} href={projectHref}>
						<div className="overview-card-header">
							<QuestProgressDonut completed={completed} total={total} size={120} />
							<div className="overview-card-info">
								<h3>{project.name}</h3>
								<p>{project.description}</p>
							</div>
						</div>
						<div className="overview-card-body">
							<div>
								<span className="stat-label">Points</span>
								<span className="stat-value">{formatNumber(points)}</span>
							</div>
						</div>
					</a>
				);
			})}
		</div>
	);
}

function ProjectQuestList({
	project,
	loading,
	points,
}: {
	project: ProjectWithQuests;
	loading: boolean;
	points: number;
}) {
	const [activeFilter, setActiveFilter] = useState<string>('all');
	const quests = project.quests;
	const completedCount = quests.filter((quest) => quest.completed).length;
	const totalCount = quests.length;

	const filters = useMemo(() => {
		const types = new Set<string>();
		quests.forEach((quest) => types.add(quest.type));
		return ['all', ...Array.from(types)];
	}, [quests]);

	const filteredQuests = useMemo(() => {
		if (activeFilter === 'all') return quests;
		return quests.filter((quest) => quest.type === activeFilter);
	}, [quests, activeFilter]);

	return (
		<div className="project-quest-view">
			<header className="project-quest-header">
				<div className="project-quest-info">
					<h2>{project.project.name}</h2>
					<p>{project.project.description}</p>
				</div>
				<div className="project-quest-meta">
					<QuestProgressDonut completed={completedCount} total={totalCount} size={140} />
					<div className="project-quest-stats">
						<div>
							<span className="stat-label">Points</span>
							<span className="stat-value">{formatNumber(points)}</span>
						</div>
						<div>
							<span className="stat-label">Completed</span>
							<span className="stat-value">
								{completedCount}/{totalCount}
							</span>
						</div>
					</div>
				</div>
			</header>

			<div className="project-quest-filters">
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

			{loading && <div className="loading-card">Refreshing quests…</div>}

			{!loading && filteredQuests.length === 0 && (
				<div className="empty-card">No quests match this filter yet.</div>
			)}

			<div className="quest-grid">
				{filteredQuests.map((quest) => {
					const completedClass = quest.completed ? 'completed' : '';
					const gradient = gradientByType[quest.type] ?? gradientByType.custom;
					const progress = quest.progress ?? 0;
					const showProgress = quest.type !== 'conditional';

					return (
						<div className={['quest-tile', completedClass].join(' ')} key={quest.id} style={{ background: gradient }}>
							<div className="tile-header">
								<span className="reward">🪙 {quest.reward}</span>
								{quest.completed && <span className="quest-check" aria-hidden="true">✓</span>}
							</div>
							<h3>{quest.title}</h3>
							<p>{quest.description}</p>
							{showProgress && (
								<div className="progress-track">
									<div className="progress-fill" style={{ width: `${Math.min(progress, 100)}%` }} />
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
		</div>
	);
}

export default function QuestDashboard() {
	const { projectQuests, userPoints, loading } = useQuestData();

	const isSingleProject = projectQuests.length === 1;
	const activeProject = isSingleProject ? projectQuests[0] : null;
	const activePoints = activeProject ? userPoints.get(activeProject.project.id) ?? 0 : 0;

	// Calculate total points across all projects
	const totalPoints = Array.from(userPoints.values()).reduce((sum, points) => sum + points, 0);

	// Set target date for countdown (14 days from now)
	const targetDate = new Date();
	targetDate.setDate(targetDate.getDate() + 14);
	targetDate.setHours(23, 59, 59, 999); // Set to end of day

	// Use countdown hook
	const countdown = useCountdown(targetDate);
	
	// Use animated points hook
	const { displayedPoints, isAnimating } = useAnimatedPoints(totalPoints);

	// Partner apps data from ecosystem
	const partnerApps = [
		{ name: 'Aave', logo: '/icons/aave.svg', website: 'https://aave.com', twitter: 'https://x.com/aave', discord: 'https://discord.gg/aave' },
		{ name: 'Veda', logo: '/icons/veda.svg', website: 'https://veda.tech', twitter: 'https://x.com/veda_labs', discord: 'https://discord.com/invite/hT4FZZTBdq' },
		{ name: 'Fluid', logo: '/icons/fluid.svg', website: 'https://fluid.io/swap/9745', twitter: 'https://x.com/0xfluid', discord: 'https://discord.com/invite/C76CeZc' },
		{ name: 'Euler', logo: '/icons/euler.svg', website: 'https://www.euler.finance', twitter: 'https://x.com/eulerfinance', discord: 'https://discord.com/invite/pTTnr7b4mT' },
		{ name: 'Balancer', logo: '/icons/balancer.svg', website: 'https://balancer.fi', twitter: 'https://x.com/Balancer', discord: 'https://discord.gg/balancer' },
		{ name: 'Trevee', logo: '/icons/trevee.svg', website: 'https://trevee.xyz/', twitter: 'https://x.com/Trevee_xyz', discord: 'https://discord.com/invite/5dy4wfWxWU' },
		{ name: 'Pendle', logo: '/icons/pendle.svg', website: 'https://pendle.finance', twitter: 'https://x.com/pendle_fi', discord: 'https://discord.gg/pendle' },
		{ name: 'Gearbox', logo: '/icons/gearbox.svg', website: 'https://gearbox.fi', twitter: 'https://x.com/GearboxProtocol', discord: 'https://discord.gg/gearbox' },
		{ name: 'Term Labs', logo: '/icons/term-labs.svg', website: 'https://app.term.finance/rewards', twitter: 'https://x.com/term_labs', discord: 'https://discord.com/invite/cFVMQNHRsx' },
		{ name: 'Curve', logo: '/icons/curve.svg', website: 'https://curve.fi', twitter: 'https://x.com/CurveFinance', discord: 'https://discord.com/invite/rgrfS7W' },
		{ name: 'Oku.Trade', logo: '/icons/oku.svg', website: 'https://oku.trade', twitter: 'https://x.com/okutrade', discord: 'https://discord.com/invite/wak5gvc8dc' }
	];

	return (
		<div className="quest-screen">
			{/* Hero Section with Points Card */}
			<div className="quest-hero-section">
				<div className="quest-hero-content">
					<div className="points-card">
						<div className="points-card-header">
							<span className="points-brand">KTEER</span>
						</div>
						<div className={`points-value ${isAnimating ? 'points-animating' : ''}`}>
							{displayedPoints.toLocaleString()} pts
						</div>
						<div className="points-footer">
							<span className="points-alliance">TRILLIONS ALLIANCE</span>
						</div>
					</div>
					
					<div className="hero-text-section">
						<h1 className="hero-title">Keep earning points to unlock a surprise USDTO reward.</h1>
						<button className="learn-more-btn">Learn more</button>
					</div>
					
					<div className="usdt-icon">
						<div className="usdt-icon-circle">
							<span className="usdt-symbol">T</span>
						</div>
						<div className="countdown-timer">
							<span className="countdown-text">
								{countdown.days.toString().padStart(2, '0')}:
								{countdown.hours.toString().padStart(2, '0')}:
								{countdown.minutes.toString().padStart(2, '0')}:
								{countdown.seconds.toString().padStart(2, '0')}
							</span>
						</div>
					</div>
				</div>
			</div>

			{/* Partner Apps Section */}
			<div className="partner-apps-section">
				<div className="partner-apps-header">
					<h2 className="partner-apps-title">Every transaction earns you points</h2>
					<div className="partner-apps-subtitle">
						<span>Automatically earn points for using any of the following apps.</span>
						<div className="tooltip-container">
							<span className="tooltip-icon">i</span>
							<div className="tooltip">every 1$ transacted earns you 100 points</div>
						</div>
					</div>
				</div>
				
				<div className="partner-apps-grid">
					{partnerApps.map((app) => (
						<div key={app.name} className="partner-app-card">
							<div className="partner-app-logo">
								<img src={app.logo} alt={`${app.name} logo`} />
							</div>
							<h3 className="partner-app-title">{app.name}</h3>
							<div className="partner-app-links">
								{app.website && (
									<a 
										href={app.website} 
										target="_blank" 
										rel="noopener noreferrer"
										className="partner-app-visit"
									>
										Visit site
									</a>
								)}
								<div className="partner-app-social">
									{app.twitter && (
										<a 
											href={app.twitter} 
											target="_blank" 
											rel="noopener noreferrer"
											className="social-icon"
										>
											<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
												<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
											</svg>
										</a>
									)}
									{app.discord && (
										<a 
											href={app.discord} 
											target="_blank" 
											rel="noopener noreferrer"
											className="social-icon"
										>
											<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
												<path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
											</svg>
										</a>
									)}
								</div>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Active Campaigns Section */}
			<div className="quest-screen-header">
				<h1 className="quest-screen-title">
					Active Campaigns
					<span className="quest-screen-counter">({projectQuests.length})</span>
				</h1>
			</div>
			{isSingleProject && activeProject ? (
				<ProjectQuestList project={activeProject} loading={loading} points={activePoints} />
			) : (
				<QuestProjectGrid projects={projectQuests} userPoints={userPoints} loading={loading} />
			)}
		</div>
	);
}
