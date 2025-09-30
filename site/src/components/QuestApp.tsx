import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import QuestDashboard from './QuestDashboard';
import { MetaMaskProvider } from '@quest-src/hooks/useMetaMask';
import { QuestDataProvider } from './QuestDataProvider';
import QuestTopBarStats from './QuestTopBarStats';
import { useQuestData } from './QuestDataProvider';
import { QUEST_PROJECT_IDS, type QuestProjectId } from '@quest-src/services/projectManager';
import './QuestApp.css';

interface QuestAppProps {
	projectId?: string;
}

const isQuestProjectId = (value: string): value is QuestProjectId =>
	QUEST_PROJECT_IDS.includes(value as QuestProjectId);

function QuestHero({ projectId }: { projectId?: QuestProjectId }) {
	const { projectQuests } = useQuestData();
	const primaryProject = projectId ? projectQuests.find((entry) => entry.project.id === projectId) : null;

	const title = primaryProject
		? `${primaryProject.project.name} quests`
		: 'Complete quests. Earn rewards.';

	const description = useMemo(() => {
		if (primaryProject) {
			const total = primaryProject.quests.length;
			return total
				? `Track your progress across ${total} quest${total === 1 ? '' : 's'} and earn rewards as you explore ${primaryProject.project.name}.`
				: `Connect your wallet to unlock upcoming quests for ${primaryProject.project.name}.`;
		}
		return 'Connect your wallet to sync quest progress across Plasma dApps and follow a guided path through the ecosystem.';
	}, [primaryProject]);

	const completedLabel = useMemo(() => {
		if (!primaryProject) return null;
		const total = primaryProject.quests.length;
		const completedCount = primaryProject.quests.filter((quest) => quest.completed).length;
		return `${completedCount} of ${total} quest${total === 1 ? '' : 's'} completed`;
	}, [primaryProject]);

	return (
		<section className="hero">
			<div>
				{projectId && (
					<a className="hero-link" href="/">
						← All quests
					</a>
				)}
				<h1>{title}</h1>
				<p>{description}</p>
		{primaryProject && completedLabel && (
					<span className="hero-meta">{completedLabel}</span>
				)}
			</div>
		</section>
	);
}

export default function QuestApp({ projectId }: QuestAppProps) {
	const [headerContainer, setHeaderContainer] = useState<HTMLElement | null>(null);

	useEffect(() => {
		setHeaderContainer(document.getElementById('quest-topbar-extra'));
	}, []);

	const normalizedProjectId = useMemo<QuestProjectId | undefined>(() => {
		if (!projectId) return undefined;
		const lower = projectId.toLowerCase();
		return isQuestProjectId(lower) ? lower : undefined;
	}, [projectId]);

	return (
		<MetaMaskProvider>
			<QuestDataProvider projectIds={normalizedProjectId ? [normalizedProjectId] : undefined}>
				{headerContainer && createPortal(<QuestTopBarStats />, headerContainer)}
				<div className="quest-page">
					<QuestHero projectId={normalizedProjectId} />
					<QuestDashboard />
				</div>
			</QuestDataProvider>
		</MetaMaskProvider>
	);
}
