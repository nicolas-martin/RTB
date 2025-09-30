/**
 * CSV-based Database Implementation
 * Implements IQuestDatabase interface using CSV files for storage
 */

import {
	IQuestDatabase,
	QuestCompletion,
	UserPoints,
	QuestCompletionFilter,
	UserPointsFilter,
} from './types';
import { FileStorage, objectsToCSV, csvToObjects } from './csvStorage';

const COMPLETIONS_FILE = 'quest_completions.csv';
const POINTS_FILE = 'user_points.csv';

const COMPLETION_HEADERS = [
	'userAddress',
	'questId',
	'projectId',
	'completed',
	'progress',
	'completedAt',
	'lastCheckedAt',
];

const POINTS_HEADERS = [
	'userAddress',
	'projectId',
	'totalPoints',
	'lastUpdatedAt',
];

/**
 * CSV Database Implementation
 * Uses localStorage-backed CSV files for data persistence
 */
export class CSVDatabase implements IQuestDatabase {
	private fileStorage: FileStorage;

	constructor() {
		this.fileStorage = new FileStorage();
	}

	// ==================== Quest Completion Operations ====================

	async getQuestCompletion(
		userAddress: string,
		questId: string,
		projectId: string
	): Promise<QuestCompletion | null> {
		const completions = await this.loadCompletions();
		const completion = completions.find(
			(c) =>
				c.userAddress === userAddress &&
				c.questId === questId &&
				c.projectId === projectId
		);

		return completion || null;
	}

	async getQuestCompletions(
		filter: QuestCompletionFilter
	): Promise<QuestCompletion[]> {
		const completions = await this.loadCompletions();

		return completions.filter((completion) => {
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
		const completions = await this.loadCompletions();

		// Check if already exists
		const existingIndex = completions.findIndex(
			(c) =>
				c.userAddress === completion.userAddress &&
				c.questId === completion.questId &&
				c.projectId === completion.projectId
		);

		if (existingIndex >= 0) {
			// Update existing
			completions[existingIndex] = completion;
		} else {
			// Add new
			completions.push(completion);
		}

		await this.saveCompletions(completions);
	}

	async updateQuestCompletion(
		userAddress: string,
		questId: string,
		projectId: string,
		updates: Partial<QuestCompletion>
	): Promise<void> {
		const completions = await this.loadCompletions();

		const existingIndex = completions.findIndex(
			(c) =>
				c.userAddress === userAddress &&
				c.questId === questId &&
				c.projectId === projectId
		);

		if (existingIndex >= 0) {
			completions[existingIndex] = {
				...completions[existingIndex],
				...updates,
			};
			await this.saveCompletions(completions);
		} else {
			throw new Error(
				`Quest completion not found: ${userAddress}/${projectId}/${questId}`
			);
		}
	}

	// ==================== User Points Operations ====================

	async getUserPoints(
		userAddress: string,
		projectId: string
	): Promise<UserPoints | null> {
		const allPoints = await this.loadPoints();
		const points = allPoints.find(
			(p) => p.userAddress === userAddress && p.projectId === projectId
		);

		return points || null;
	}

	async getAllUserPoints(filter: UserPointsFilter): Promise<UserPoints[]> {
		const allPoints = await this.loadPoints();

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
		const allPoints = await this.loadPoints();

		// Check if already exists
		const existingIndex = allPoints.findIndex(
			(p) =>
				p.userAddress === points.userAddress &&
				p.projectId === points.projectId
		);

		if (existingIndex >= 0) {
			// Update existing
			allPoints[existingIndex] = points;
		} else {
			// Add new
			allPoints.push(points);
		}

		await this.savePoints(allPoints);
	}

	async updateUserPoints(
		userAddress: string,
		projectId: string,
		pointsDelta: number
	): Promise<void> {
		const allPoints = await this.loadPoints();

		const existingIndex = allPoints.findIndex(
			(p) => p.userAddress === userAddress && p.projectId === projectId
		);

		if (existingIndex >= 0) {
			// Update existing points
			allPoints[existingIndex].totalPoints += pointsDelta;
			allPoints[existingIndex].lastUpdatedAt = new Date().toISOString();
		} else {
			// Create new points record
			allPoints.push({
				userAddress,
				projectId,
				totalPoints: pointsDelta,
				lastUpdatedAt: new Date().toISOString(),
			});
		}

		await this.savePoints(allPoints);
	}

	// ==================== Utility Operations ====================

	async clearUserData(userAddress: string, projectId?: string): Promise<void> {
		// Clear completions
		let completions = await this.loadCompletions();
		completions = completions.filter((c) => {
			if (c.userAddress !== userAddress) return true;
			if (projectId && c.projectId !== projectId) return true;
			return false;
		});
		await this.saveCompletions(completions);

		// Clear points
		let points = await this.loadPoints();
		points = points.filter((p) => {
			if (p.userAddress !== userAddress) return true;
			if (projectId && p.projectId !== projectId) return true;
			return false;
		});
		await this.savePoints(points);
	}

	async clearAllData(): Promise<void> {
		await this.fileStorage.clearAll();
	}

	// ==================== Private Helper Methods ====================

	private async loadCompletions(): Promise<QuestCompletion[]> {
		try {
			const exists = await this.fileStorage.fileExists(COMPLETIONS_FILE);
			if (!exists) {
				return [];
			}

			const csv = await this.fileStorage.readFile(COMPLETIONS_FILE);
			const rawData = csvToObjects<any>(csv);

			// Convert string values to proper types
			return rawData.map((item) => ({
				...item,
				completed: item.completed === 'true',
				progress: item.progress ? parseFloat(item.progress) : undefined,
			}));
		} catch (error) {
			console.error('Failed to load completions:', error);
			return [];
		}
	}

	private async saveCompletions(
		completions: QuestCompletion[]
	): Promise<void> {
		const csv = objectsToCSV(completions, {
			headers: COMPLETION_HEADERS,
		});
		await this.fileStorage.writeFile(COMPLETIONS_FILE, csv);
	}

	private async loadPoints(): Promise<UserPoints[]> {
		try {
			const exists = await this.fileStorage.fileExists(POINTS_FILE);
			if (!exists) {
				return [];
			}

			const csv = await this.fileStorage.readFile(POINTS_FILE);
			const rawData = csvToObjects<any>(csv);

			// Convert string values to proper types
			return rawData.map((item) => ({
				...item,
				totalPoints: parseFloat(item.totalPoints) || 0,
			}));
		} catch (error) {
			console.error('Failed to load points:', error);
			return [];
		}
	}

	private async savePoints(points: UserPoints[]): Promise<void> {
		const csv = objectsToCSV(points, {
			headers: POINTS_HEADERS,
		});
		await this.fileStorage.writeFile(POINTS_FILE, csv);
	}
}
