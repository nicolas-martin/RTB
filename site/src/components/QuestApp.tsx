import { useMemo } from 'react';
import QuestDashboard from './QuestDashboard';
import { QUEST_PROJECT_IDS, type QuestProjectId } from '@quest-src/services/projectManager';
import './QuestApp.css';
import QuestProvider from './QuestProvider';
import { withBasePath } from '@lib/basePath';

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
					<a className="hero-link" href={withBasePath('/')}>
						← All quests
					</a>
				)}
			</div>
		</section>
	);
}


export default function QuestApp({ projectId }: QuestAppProps) {
	const normalizedProjectId = useMemo<QuestProjectId | undefined>(() => {
		if (!projectId) return undefined;
		const lower = projectId.toLowerCase();
		return isQuestProjectId(lower) ? lower : undefined;
	}, [projectId]);

	return (
		<QuestProvider projectIds={normalizedProjectId ? [normalizedProjectId] : undefined}>
			<div className="quest-page">
					<QuestHero projectId={normalizedProjectId} />
					<QuestDashboard />
				</div>
		</QuestProvider>
	);
}
