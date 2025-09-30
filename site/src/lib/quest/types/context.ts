import type { ProjectMetadata, Quest } from './quest';

export interface ProjectWithQuests {
	project: ProjectMetadata;
	quests: Quest[];
}

export interface QuestTotals {
	totalQuests: number;
	completed: number;
	completionPct: number;
	points: number;
}
