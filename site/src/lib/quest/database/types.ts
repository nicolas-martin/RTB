/**
 * Database types for quest completion tracking
 */

/**
 * Represents a user's quest completion record
 */
export interface QuestCompletion {
	userAddress: string;
	questId: string;
	projectId: string;
	completed: boolean;
	progress?: number;
	completedAt?: string; // ISO 8601 timestamp
	lastCheckedAt: string; // ISO 8601 timestamp
}

/**
 * Represents a user's accumulated points
 */
export interface UserPoints {
	userAddress: string;
	projectId: string;
	totalPoints: number;
	lastUpdatedAt: string; // ISO 8601 timestamp
}

/**
 * Query filters for retrieving quest completions
 */
export interface QuestCompletionFilter {
	userAddress?: string;
	questId?: string;
	projectId?: string;
	completed?: boolean;
}

/**
 * Query filters for retrieving user points
 */
export interface UserPointsFilter {
	userAddress?: string;
	projectId?: string;
}

/**
 * Database interface that all storage implementations must follow
 * This abstraction allows easy migration from CSV to a real database
 */
export interface IQuestDatabase {
	// Quest Completion Operations
	getQuestCompletion(
		userAddress: string,
		questId: string,
		projectId: string
	): Promise<QuestCompletion | null>;

	getQuestCompletions(
		filter: QuestCompletionFilter
	): Promise<QuestCompletion[]>;

	saveQuestCompletion(completion: QuestCompletion): Promise<void>;

	updateQuestCompletion(
		userAddress: string,
		questId: string,
		projectId: string,
		updates: Partial<QuestCompletion>
	): Promise<void>;

	// User Points Operations
	getUserPoints(
		userAddress: string,
		projectId: string
	): Promise<UserPoints | null>;

	getAllUserPoints(filter: UserPointsFilter): Promise<UserPoints[]>;

	saveUserPoints(points: UserPoints): Promise<void>;

	updateUserPoints(
		userAddress: string,
		projectId: string,
		pointsDelta: number
	): Promise<void>;

	// Utility Operations
	clearUserData(userAddress: string, projectId?: string): Promise<void>;

	clearAllData(): Promise<void>;
}
