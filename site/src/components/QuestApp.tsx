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

	return (
		<section className="hero">
			<div>
				{projectId && (
					<a className="hero-link" href="/">
						← All quests
					</a>
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
