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
	ecosystemProjects,
}: {
	projects: ProjectWithQuests[];
	userPoints: Map<string, number>;
	loading: boolean;
	ecosystemProjects?: any[];
}) {
	if (loading && projects.length === 0) {
		return <div className="loading-card">Loading quests…</div>;
	}

	if (!loading && projects.length === 0) {
		return <div className="empty-card">Quest-enabled apps will appear here soon.</div>;
	}

	const baseUrl = import.meta.env.BASE_URL ?? '/';
	const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

	// Helper function to find ecosystem project data
	const getEcosystemData = (projectId: string) => {
		return ecosystemProjects?.find((p: any) => 
			p.quest_slug?.toLowerCase() === projectId?.toLowerCase() ||
			p.name?.toLowerCase() === projectId?.toLowerCase()
		);
	};

	return (
		<div className="campaign-grid">
			{projects.map(({ project, quests }) => {
				const completed = quests.filter((quest) => quest.completed).length;
				const total = quests.length;
				const points = userPoints.get(project.id) ?? 0;
				const projectHref = `${normalizedBase}quest/${project.id}`;
				const ecosystemData = getEcosystemData(project.id);
				
				const coverImage = ecosystemData?.cover_image || '';
				const logoSrc = ecosystemData?.logo_src || '';
				const description = ecosystemData?.description || project.description || '';

				return (
					<a className="campaign-card" key={project.id} href={projectHref}>
						{/* Section 1: Cover Image with Logo */}
						<div className="campaign-card-cover" style={{
							backgroundImage: coverImage ? `url(${coverImage})` : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
						}}>
							<div className="campaign-card-overlay">
								{logoSrc && (
									<div className="campaign-card-logo">
										<img src={logoSrc} alt={project.name} />
									</div>
								)}
							</div>
						</div>

						{/* Section 2: Title and Description */}
						<div className="campaign-card-content">
							<h3 className="campaign-card-title">{project.name}</h3>
							<p className="campaign-card-description">{description}</p>
						</div>

						{/* Section 3: Earn Now Button */}
						<div className="campaign-card-footer">
							<button className="campaign-card-button">
								Earn now
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
									<path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
								</svg>
							</button>
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

export default function QuestDashboard({ ecosystemProjects }: { ecosystemProjects?: any[] }) {
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
					
					<div className="usdt-icon-container">
						<div className="coin-simple">
							<div className="coin-rotating">
								<img src="/icons/usdt0.png" alt="USDT" className="usdt-icon-image" />
							</div>
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
						<a 
							key={app.name} 
							href={app.website} 
							target="_blank" 
							rel="noopener noreferrer"
							className="partner-app-card"
						>
							<div className="partner-app-logo">
								<img src={app.logo} alt={`${app.name} logo`} />
							</div>
							<h3 className="partner-app-title">{app.name}</h3>
						</a>
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
				<QuestProjectGrid projects={projectQuests} userPoints={userPoints} loading={loading} ecosystemProjects={ecosystemProjects} />
			)}
		</div>
	);
}
