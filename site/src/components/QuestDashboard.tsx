import { useMemo, useState } from 'react';
import type { ProjectWithQuests } from '@quest-src/types/context';
import { useQuestData } from './QuestDataProvider';
import './QuestDashboard.css';

const gradientByType: Record<string, string> = {
	conditional: 'linear-gradient(135deg, rgba(120, 116, 255, 0.32), rgba(64, 196, 255, 0.18))',
	progress: 'linear-gradient(135deg, rgba(255, 170, 92, 0.34), rgba(255, 94, 150, 0.18))',
	custom: 'linear-gradient(135deg, rgba(110, 255, 208, 0.32), rgba(112, 164, 255, 0.18))',
};

const formatNumber = (value: number) => new Intl.NumberFormat().format(value);

function QuestProgressDonut({
	completed,
	total,
	size = 104,
}: {
	completed: number;
	total: number;
	size?: number;
}) {
	const strokeWidth = 10;
	const radius = size / 2 - strokeWidth;
	const circumference = 2 * Math.PI * radius;
	const progress = total === 0 ? 0 : Math.min(completed / total, 1);
	const strokeDashoffset = circumference * (1 - progress);

	return (
		<svg
			className="quest-donut"
			width={size}
			height={size}
			viewBox={`0 0 ${size} ${size}`}
		>
			<circle
				className="quest-donut-track"
				cx={size / 2}
				cy={size / 2}
				r={radius}
				strokeWidth={strokeWidth}
				fill="transparent"
			/>
			<circle
				className="quest-donut-progress"
				cx={size / 2}
				cy={size / 2}
				r={radius}
				strokeWidth={strokeWidth}
				fill="transparent"
				strokeDasharray={circumference}
				strokeDashoffset={strokeDashoffset}
			/>
			<text x="50%" y="52%" className="quest-donut-text">
				{total === 0 ? '0%' : `${Math.round(progress * 100)}%`}
			</text>
		</svg>
	);
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

	return (
		<div className="overview-grid">
			{projects.map(({ project, quests }) => {
				const completed = quests.filter((quest) => quest.completed).length;
				const total = quests.length;
				const points = userPoints.get(project.id) ?? 0;

				return (
					<a className="overview-card" key={project.id} href={`/quest/${project.id}`}>
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

	return (
		<div className="quest-screen">
			{isSingleProject && activeProject ? (
				<ProjectQuestList project={activeProject} loading={loading} points={activePoints} />
			) : (
				<QuestProjectGrid projects={projectQuests} userPoints={userPoints} loading={loading} />
			)}
		</div>
	);
}
