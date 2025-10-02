/**
 * In-Memory Database Implementation
 * Implements IQuestDatabase interface using in-memory storage
 * Suitable for development and testing
 */

import {
	IQuestDatabase,
	QuestCompletion,
	UserPoints,
	QuestCompletionFilter,
	UserPointsFilter,
} from './types.js';

/**
 * In-Memory Database Implementation
 * Uses Maps for fast lookups
 */
export class MemoryDatabase implements IQuestDatabase {
	private completions: Map<string, QuestCompletion> = new Map();
	private points: Map<string, UserPoints> = new Map();

	private getCompletionKey(userAddress: string, questId: string, projectId: string): string {
		return `${userAddress}:${projectId}:${questId}`;
	}

	private getPointsKey(userAddress: string, projectId: string): string {
		return `${userAddress}:${projectId}`;
	}

	// ==================== Quest Completion Operations ====================

	async getQuestCompletion(
		userAddress: string,
		questId: string,
		projectId: string
	): Promise<QuestCompletion | null> {
		const key = this.getCompletionKey(userAddress, questId, projectId);
		return this.completions.get(key) || null;
	}

	async getQuestCompletions(
		filter: QuestCompletionFilter
	): Promise<QuestCompletion[]> {
		const allCompletions = Array.from(this.completions.values());

		return allCompletions.filter((completion) => {
			if (
				filter.userAddress &&
				completion.userAddress !== filter.userAddress
			) {
				return false;
			}
			if (filter.questId && completion.questId !== filter.questId) {
				return false;
			}
			if (filter.projectId && completion.projectId !== filter.projectId) {
				return false;
			}
			if (
				filter.completed !== undefined &&
				completion.completed !== filter.completed
			) {
				return false;
			}
			return true;
		});
	}

	async saveQuestCompletion(completion: QuestCompletion): Promise<void> {
		const key = this.getCompletionKey(
			completion.userAddress,
			completion.questId,
			completion.projectId
		);
		this.completions.set(key, completion);
	}

	async updateQuestCompletion(
		userAddress: string,
		questId: string,
		projectId: string,
		updates: Partial<QuestCompletion>
	): Promise<void> {
		const key = this.getCompletionKey(userAddress, questId, projectId);
		const existing = this.completions.get(key);

		if (!existing) {
			throw new Error(
				`Quest completion not found: ${userAddress}/${projectId}/${questId}`
			);
		}

		this.completions.set(key, {
			...existing,
			...updates,
		});
	}

	// ==================== User Points Operations ====================

	async getUserPoints(
		userAddress: string,
		projectId: string
	): Promise<UserPoints | null> {
		const key = this.getPointsKey(userAddress, projectId);
		return this.points.get(key) || null;
	}

	async getAllUserPoints(filter: UserPointsFilter): Promise<UserPoints[]> {
		const allPoints = Array.from(this.points.values());

		return allPoints.filter((points) => {
			if (filter.userAddress && points.userAddress !== filter.userAddress) {
				return false;
			}
			if (filter.projectId && points.projectId !== filter.projectId) {
				return false;
			}
			return true;
		});
	}

	async saveUserPoints(points: UserPoints): Promise<void> {
		const key = this.getPointsKey(points.userAddress, points.projectId);
		this.points.set(key, points);
	}

	async updateUserPoints(
		userAddress: string,
		projectId: string,
		pointsDelta: number
	): Promise<void> {
		const key = this.getPointsKey(userAddress, projectId);
		const existing = this.points.get(key);

		if (existing) {
			// Update existing points
			this.points.set(key, {
				...existing,
				totalPoints: existing.totalPoints + pointsDelta,
				lastUpdatedAt: new Date().toISOString(),
			});
		} else {
			// Create new points record
			this.points.set(key, {
				userAddress,
				projectId,
				totalPoints: pointsDelta,
				lastUpdatedAt: new Date().toISOString(),
			});
		}
	}

	// ==================== Utility Operations ====================

	async clearUserData(userAddress: string, projectId?: string): Promise<void> {
		// Clear completions
		for (const [key, completion] of this.completions.entries()) {
			if (completion.userAddress === userAddress) {
				if (!projectId || completion.projectId === projectId) {
					this.completions.delete(key);
				}
			}
		}

		// Clear points
		for (const [key, points] of this.points.entries()) {
			if (points.userAddress === userAddress) {
				if (!projectId || points.projectId === projectId) {
					this.points.delete(key);
				}
			}
		}
	}

	async clearAllData(): Promise<void> {
		this.completions.clear();
		this.points.clear();
	}
}
