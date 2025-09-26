export type QuestType = 'conditional' | 'progress' | 'sequential' | 'custom';

export interface ProjectMetadata {
	id: string;
	name: string;
	description: string;
	graphqlEndpoint: string;
}

export interface QuestCondition {
	field: string;
	itemConditionField?: string;
	operator: '=' | '!=' | '>' | '>=' | '<' | '<=';
	value: string | number;
}

export interface SequenceCondition {
	field: string;
	sequenceLength: number;
}

export interface QuestConfig {
	id: string;
	title: string;
	description: string;
	reward: number;
	type: QuestType;
	query: string;
	startDate?: string;
	endDate?: string;
	conditions?: QuestCondition[];
	sequenceCondition?: SequenceCondition;
	validatorParams?: Record<string, any>;
}

export interface Quest extends QuestConfig {
	completed: boolean;
	progress?: number;
}

export interface QuestProgress {
	questId: string;
	completed: boolean;
	progress?: number;
	lastUpdated: string;
}

export interface ProjectWithQuests {
	project: ProjectMetadata;
	quests: QuestConfig[];
}
