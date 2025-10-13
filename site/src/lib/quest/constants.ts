/**
 * Quest system constants
 */

export const QUEST_PROJECT_IDS = ['aave', 'gluex', 'fluid'] as const;

export type QuestProjectId = (typeof QUEST_PROJECT_IDS)[number];
