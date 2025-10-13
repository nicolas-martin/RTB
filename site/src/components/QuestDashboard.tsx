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
									<path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
								</svg>
							</button>
						</div>
					</a>
				);
			})}
		</div>
	);
}

export default function QuestDashboard({ ecosystemProjects }: { ecosystemProjects?: any[] }) {
	const { projectQuests, userPoints, loading } = useQuestData();
	const [partnerApps, setPartnerApps] = useState<any[]>([]);

	// Filter out projects with no quests (partner apps without campaigns)
	const projectsWithQuests = useMemo(() => {
		return projectQuests.filter(({ quests }) => quests.length > 0);
	}, [projectQuests]);

	// Fetch partner apps from backend
	useEffect(() => {
		const fetchProjects = async () => {
			try {
				const API_BASE_URL = import.meta.env.PUBLIC_QUEST_API_URL || 'http://localhost:3001';
				const response = await fetch(`${API_BASE_URL}/api/projects`);
				if (response.ok) {
					const projects = await response.json();
					// Filter to only include projects that have website metadata (partner apps)
					const apps = projects
						.filter((p: any) => p.id !== 'rtb' && p.website) // Exclude RTB as it's not a partner
						.map((p: any) => ({
							name: p.name,
							logo: p.logo || `/icons/${p.id}.svg`,
							website: p.website,
							twitter: p.twitter,
							discord: p.discord
						}));
					setPartnerApps(apps);
				}
			} catch (error) {
				console.error('Failed to fetch projects:', error);
				// Fallback to default partner apps if fetch fails
				setPartnerApps([
					{ name: 'Aave', logo: '/icons/aave.svg', website: 'https://aave.com', twitter: 'https://x.com/aave', discord: 'https://discord.gg/aave' },
					{ name: 'GlueX', logo: '/icons/gluex.svg', website: 'https://gluex.xyz', twitter: 'https://x.com/GluexProtocol', discord: 'https://discord.com/invite/gluex' },
					{ name: 'Fluid', logo: '/icons/fluid.svg', website: 'https://fluid.io/swap/9745', twitter: 'https://x.com/0xfluid', discord: 'https://discord.com/invite/C76CeZc' },
				]);
			}
		};
		fetchProjects();
	}, []);

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

	return (
		<div className="quest-screen">
			{/* Hero Section with Points Card */}
			<div className="quest-hero-section">
				<div className="quest-hero-content">
					<div className="points-card">
						<div className="points-card-header">
							<span className="points-brand">Tokenback</span>
						</div>
						<div className={`points-value ${isAnimating ? 'points-animating' : ''}`}>
							{displayedPoints.toLocaleString()} pts
						</div>
						<div className="points-footer">
							<span className="points-alliance">StablePoints</span>
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
					<span className="quest-screen-counter">({projectsWithQuests.length})</span>
				</h1>
			</div>
			<QuestProjectGrid projects={projectsWithQuests} userPoints={userPoints} loading={loading} ecosystemProjects={ecosystemProjects} />
		</div>
	);
}
