import type {
	IQuestDatabase,
	QuestCompletion,
	UserPoints,
	QuestCompletionFilter,
	UserPointsFilter,
} from './types';

const COMPLETIONS_KEY = 'quest_completions';
const POINTS_KEY = 'user_points';

export class LocalStorageDatabase implements IQuestDatabase {
	private isAvailable(): boolean {
		if (typeof window === 'undefined') return false;
		try {
			const test = '__storage_test__';
			localStorage.setItem(test, test);
			localStorage.removeItem(test);
			return true;
		} catch {
			return false;
		}
	}

	private getCompletions(): QuestCompletion[] {
		if (!this.isAvailable()) return [];
		const data = localStorage.getItem(COMPLETIONS_KEY);
		return data ? JSON.parse(data) : [];
	}

	private saveCompletions(completions: QuestCompletion[]): void {
		if (!this.isAvailable()) return;
		localStorage.setItem(COMPLETIONS_KEY, JSON.stringify(completions));
	}

	private getPoints(): UserPoints[] {
		if (!this.isAvailable()) return [];
		const data = localStorage.getItem(POINTS_KEY);
		return data ? JSON.parse(data) : [];
	}

	private savePoints(points: UserPoints[]): void {
		if (!this.isAvailable()) return;
		localStorage.setItem(POINTS_KEY, JSON.stringify(points));
	}

	async getQuestCompletion(
		userAddress: string,
		questId: string,
		projectId: string
	): Promise<QuestCompletion | null> {
		const completions = this.getCompletions();
		return (
			completions.find(
				(c) =>
					c.userAddress === userAddress &&
					c.questId === questId &&
					c.projectId === projectId
			) || null
		);
	}

	async getQuestCompletions(
		filter: QuestCompletionFilter
	): Promise<QuestCompletion[]> {
		const completions = this.getCompletions();
		return completions.filter((c) => {
			if (filter.userAddress && c.userAddress !== filter.userAddress)
				return false;
			if (filter.questId && c.questId !== filter.questId) return false;
			if (filter.projectId && c.projectId !== filter.projectId) return false;
			if (filter.completed !== undefined && c.completed !== filter.completed)
				return false;
			return true;
		});
	}

	async saveQuestCompletion(completion: QuestCompletion): Promise<void> {
		const completions = this.getCompletions();
		const index = completions.findIndex(
			(c) =>
				c.userAddress === completion.userAddress &&
				c.questId === completion.questId &&
				c.projectId === completion.projectId
		);

		if (index >= 0) {
			completions[index] = completion;
		} else {
			completions.push(completion);
		}

		this.saveCompletions(completions);
	}

	async updateQuestCompletion(
		userAddress: string,
		questId: string,
		projectId: string,
		updates: Partial<QuestCompletion>
	): Promise<void> {
		const completions = this.getCompletions();
		const index = completions.findIndex(
			(c) =>
				c.userAddress === userAddress &&
				c.questId === questId &&
				c.projectId === projectId
		);

		if (index >= 0) {
			completions[index] = { ...completions[index], ...updates };
			this.saveCompletions(completions);
		}
	}

	async getUserPoints(
		userAddress: string,
		projectId: string
	): Promise<UserPoints | null> {
		const points = this.getPoints();
		return (
			points.find(
				(p) => p.userAddress === userAddress && p.projectId === projectId
			) || null
		);
	}

	async getAllUserPoints(filter: UserPointsFilter): Promise<UserPoints[]> {
		const points = this.getPoints();
		return points.filter((p) => {
			if (filter.userAddress && p.userAddress !== filter.userAddress)
				return false;
			if (filter.projectId && p.projectId !== filter.projectId) return false;
			return true;
		});
	}

	async saveUserPoints(points: UserPoints): Promise<void> {
		const allPoints = this.getPoints();
		const index = allPoints.findIndex(
			(p) =>
				p.userAddress === points.userAddress && p.projectId === points.projectId
		);

		if (index >= 0) {
			allPoints[index] = points;
		} else {
			allPoints.push(points);
		}

		this.savePoints(allPoints);
	}

	async updateUserPoints(
		userAddress: string,
		projectId: string,
		pointsDelta: number
	): Promise<void> {
		const allPoints = this.getPoints();
		const index = allPoints.findIndex(
			(p) => p.userAddress === userAddress && p.projectId === projectId
		);

		if (index >= 0) {
			allPoints[index].totalPoints += pointsDelta;
			allPoints[index].lastUpdatedAt = new Date().toISOString();
		} else {
			allPoints.push({
				userAddress,
				projectId,
				totalPoints: pointsDelta,
				lastUpdatedAt: new Date().toISOString(),
			});
		}

		this.savePoints(allPoints);
	}

	async clearUserData(userAddress: string, projectId?: string): Promise<void> {
		let completions = this.getCompletions();
		let points = this.getPoints();

		if (projectId) {
			completions = completions.filter(
				(c) => !(c.userAddress === userAddress && c.projectId === projectId)
			);
			points = points.filter(
				(p) => !(p.userAddress === userAddress && p.projectId === projectId)
			);
		} else {
			completions = completions.filter((c) => c.userAddress !== userAddress);
			points = points.filter((p) => p.userAddress !== userAddress);
		}

		this.saveCompletions(completions);
		this.savePoints(points);
	}

	async clearAllData(): Promise<void> {
		if (!this.isAvailable()) return;
		localStorage.removeItem(COMPLETIONS_KEY);
		localStorage.removeItem(POINTS_KEY);
	}
}
