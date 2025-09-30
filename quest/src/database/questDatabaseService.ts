/**
 * Quest Database Service
 * High-level service for quest-specific database operations
 * Provides convenient methods for the quest system
 */

import {
	IQuestDatabase,
	QuestCompletion,
	UserPoints,
	QuestCompletionFilter,
} from './types';
import { getDatabase } from './index';

/**
 * Service for managing quest completions and user points
 * This is the main interface the quest system should use
 */
export class QuestDatabaseService {
	private db: IQuestDatabase;

	constructor(database?: IQuestDatabase) {
		this.db = database || getDatabase();
	}

	/**
	 * Check if a user has completed a specific quest
	 */
	async isQuestCompleted(
		userAddress: string,
		questId: string,
		projectId: string
	): Promise<boolean> {
		const completion = await this.db.getQuestCompletion(
			userAddress,
			questId,
			projectId
		);
		return completion?.completed ?? false;
	}

	/**
	 * Mark a quest as completed and award points
	 * Returns true if the quest was newly completed (not already completed)
	 */
	async markQuestCompleted(
		userAddress: string,
		questId: string,
		projectId: string,
		pointsReward: number
	): Promise<boolean> {
		// Check if already completed
		const existing = await this.db.getQuestCompletion(
			userAddress,
			questId,
			projectId
		);

		if (existing && existing.completed) {
			// Already completed, don't award points again
			return false;
		}

		const now = new Date().toISOString();

		// Save or update quest completion
		const completion: QuestCompletion = {
			userAddress,
			questId,
			projectId,
			completed: true,
			progress: 100,
			completedAt: now,
			lastCheckedAt: now,
		};

		await this.db.saveQuestCompletion(completion);

		// Award points
		if (pointsReward > 0) {
			await this.db.updateUserPoints(userAddress, projectId, pointsReward);
		}

		return true;
	}

	/**
	 * Update quest progress (for progress-type quests)
	 */
	async updateQuestProgress(
		userAddress: string,
		questId: string,
		projectId: string,
		progress: number
	): Promise<void> {
		const existing = await this.db.getQuestCompletion(
			userAddress,
			questId,
			projectId
		);

		const now = new Date().toISOString();

		if (existing) {
			await this.db.updateQuestCompletion(
				userAddress,
				questId,
				projectId,
				{
					progress,
					lastCheckedAt: now,
				}
			);
		} else {
			const completion: QuestCompletion = {
				userAddress,
				questId,
				projectId,
				completed: false,
				progress,
				lastCheckedAt: now,
			};

			await this.db.saveQuestCompletion(completion);
		}
	}

	/**
	 * Get all completed quests for a user
	 */
	async getUserCompletedQuests(
		userAddress: string,
		projectId?: string
	): Promise<QuestCompletion[]> {
		const filter: QuestCompletionFilter = {
			userAddress,
			completed: true,
		};

		if (projectId) {
			filter.projectId = projectId;
		}

		return await this.db.getQuestCompletions(filter);
	}

	/**
	 * Get all quest completions (completed and in-progress) for a user
	 */
	async getUserQuestCompletions(
		userAddress: string,
		projectId?: string
	): Promise<QuestCompletion[]> {
		const filter: QuestCompletionFilter = {
			userAddress,
		};

		if (projectId) {
			filter.projectId = projectId;
		}

		return await this.db.getQuestCompletions(filter);
	}

	/**
	 * Get user's total points for a project
	 */
	async getUserPoints(
		userAddress: string,
		projectId: string
	): Promise<number> {
		const points = await this.db.getUserPoints(userAddress, projectId);
		return points?.totalPoints ?? 0;
	}

	/**
	 * Get user's total points across all projects
	 */
	async getUserTotalPoints(userAddress: string): Promise<number> {
		const allPoints = await this.db.getAllUserPoints({ userAddress });
		return allPoints.reduce((sum, p) => sum + p.totalPoints, 0);
	}

	/**
	 * Get leaderboard for a project (top users by points)
	 */
	async getLeaderboard(
		projectId: string,
		limit: number = 10
	): Promise<UserPoints[]> {
		const allPoints = await this.db.getAllUserPoints({ projectId });

		// Sort by points descending
		allPoints.sort((a, b) => b.totalPoints - a.totalPoints);

		// Return top N
		return allPoints.slice(0, limit);
	}

	/**
	 * Clear all data for a user (useful for testing or user data deletion)
	 */
	async clearUserData(userAddress: string, projectId?: string): Promise<void> {
		await this.db.clearUserData(userAddress, projectId);
	}

	/**
	 * Get quest statistics for a user
	 */
	async getUserQuestStats(
		userAddress: string,
		projectId?: string
	): Promise<{
		totalQuests: number;
		completedQuests: number;
		inProgressQuests: number;
		totalPoints: number;
	}> {
		const completions = await this.getUserQuestCompletions(
			userAddress,
			projectId
		);

		const completed = completions.filter((c) => c.completed);
		const inProgress = completions.filter(
			(c) => !c.completed && (c.progress ?? 0) > 0
		);

		let totalPoints = 0;
		if (projectId) {
			totalPoints = await this.getUserPoints(userAddress, projectId);
		} else {
			totalPoints = await this.getUserTotalPoints(userAddress);
		}

		return {
			totalQuests: completions.length,
			completedQuests: completed.length,
			inProgressQuests: inProgress.length,
			totalPoints,
		};
	}

	/**
	 * Batch check: Get completion status for multiple quests
	 */
	async getQuestsCompletionStatus(
		userAddress: string,
		projectId: string,
		questIds: string[]
	): Promise<Map<string, boolean>> {
		const completions = await this.getUserQuestCompletions(
			userAddress,
			projectId
		);

		const statusMap = new Map<string, boolean>();

		for (const questId of questIds) {
			const completion = completions.find((c) => c.questId === questId);
			statusMap.set(questId, completion?.completed ?? false);
		}

		return statusMap;
	}
}

/**
 * Create a new quest database service instance
 */
export function createQuestDatabaseService(
	database?: IQuestDatabase
): QuestDatabaseService {
	return new QuestDatabaseService(database);
}

/**
 * Singleton instance for convenience
 */
let serviceInstance: QuestDatabaseService | null = null;

export function getQuestDatabaseService(): QuestDatabaseService {
	if (!serviceInstance) {
		serviceInstance = createQuestDatabaseService();
	}
	return serviceInstance;
}

/**
 * Reset singleton (useful for testing)
 */
export function resetQuestDatabaseService(): void {
	serviceInstance = null;
}
