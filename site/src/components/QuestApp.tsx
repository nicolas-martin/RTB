import { useMemo, useState, useEffect } from 'react';
import QuestDashboard from './QuestDashboard';
import QuestPageHeader from './QuestPageHeader';
import QuestProjectProfile from './QuestProjectProfile';
import QuestStatsCard from './QuestStatsCard';
import QuestListSection from './QuestListSection';
import { QUEST_PROJECT_IDS, type QuestProjectId } from '@quest-src/services/projectManager';
import { useQuestData } from './QuestDataProvider';
import './QuestApp.css';
import QuestProvider from './QuestProvider';
import { withBasePath } from '@lib/basePath';

interface QuestAppProps {
	projectId?: string;
	projectInfo?: {
		name: string;
		description?: string;
		website?: string;
		twitter?: string;
		discord?: string;
		logo_src?: string;
		logo_alt?: string;
	};
	ecosystemProjects?: any[];
	questMetadata?: any[];
	allQuestMetadata?: Record<string, any[]>;
}

const isQuestProjectId = (value: string): value is QuestProjectId =>
	QUEST_PROJECT_IDS.includes(value as QuestProjectId);

function QuestPageContent({ projectId, projectInfo }: { projectId: QuestProjectId; projectInfo?: any }) {
	const { projectQuests, userPoints, loading } = useQuestData();
	
	const activeProject = projectQuests.find(p => p.project.id === projectId);
	const activePoints = activeProject ? userPoints.get(activeProject.project.id) ?? 0 : 0;
	
	const handleBack = () => {
		window.history.back();
	};

	// Show loading state while quests are loading
	if (loading) {
		return (
			<div className="quest-page">
				<QuestPageHeader 
					projectId={projectId} 
					projectName={projectInfo?.name || projectId} 
					onBack={handleBack} 
				/>
				<div className="quest-page-loading">Loading quests...</div>
			</div>
		);
	}

	// Show error if project not found after loading is complete
	if (!activeProject) {
		return (
			<div className="quest-page">
				<QuestPageHeader 
					projectId={projectId} 
					projectName={projectInfo?.name || projectId} 
					onBack={handleBack} 
				/>
				<div className="quest-page-error">Project not found</div>
			</div>
		);
	}

	const completedCount = activeProject.quests.filter(quest => quest.completed).length;
	const totalCount = activeProject.quests.length;

	return (
		<div className="quest-page">
			<QuestPageHeader 
				projectId={projectId} 
				projectName={activeProject.project.name} 
				onBack={handleBack} 
			/>
			
			<QuestProjectProfile 
				project={activeProject.project} 
				ecosystemProject={projectInfo}
				completed={completedCount}
				total={totalCount}
				points={activePoints}
			/>
			
			<QuestListSection 
				quests={activeProject.quests}
				loading={loading}
				points={activePoints}
				completed={completedCount}
				total={totalCount}
			/>
		</div>
	);
}

export default function QuestApp({ projectId, projectInfo, ecosystemProjects, questMetadata, allQuestMetadata }: QuestAppProps) {
	const normalizedProjectId = useMemo<QuestProjectId | undefined>(() => {
		if (!projectId) return undefined;
		const lower = projectId.toLowerCase();
		return isQuestProjectId(lower) ? lower : undefined;
	}, [projectId]);

	return (
		<QuestProvider
			projectIds={normalizedProjectId ? [normalizedProjectId] : undefined}
			preloadedQuestData={allQuestMetadata}
		>
			{normalizedProjectId ? (
				<QuestPageContent projectId={normalizedProjectId} projectInfo={projectInfo} />
			) : (
				<div className="quest-page">
					<QuestDashboard ecosystemProjects={ecosystemProjects} />
				</div>
			)}
		</QuestProvider>
	);
}
