import type { Quest } from '../types/quest';

const API_BASE_URL = import.meta.env.PUBLIC_QUEST_API_URL || 'http://localhost:3001';

export interface QuestProgress {
	quest_id: string;
	completed: boolean;
	progress: number | null;
	points_earned: number;
	completed_at: string | null;
	last_checked_at: string;
}

export interface PointsSummary {
	wallet_address: string;
	project_id: string;
	total_earned: number;
	total_redeemed: number;
	available: number;
}

export interface PointsTransaction {
	id: string;
	wallet_address: string;
	project_id: string;
	transaction_type: 'earned' | 'redeemed';
	amount: number;
	quest_id: string | null;
	reason: string | null;
	created_at: string;
}

export class QuestApiClient {
	/**
	 * Get quest metadata (no progress data)
	 */
	async getQuests(projectId: string): Promise<Quest[]> {
		const response = await fetch(`${API_BASE_URL}/api/quests?projectId=${projectId}`);
		if (!response.ok) {
			throw new Error(`Failed to fetch quests: ${response.statusText}`);
		}
		return response.json();
	}

	/**
	 * Get all projects with their metadata
	 */
	async getAllProjects(): Promise<any[]> {
		const response = await fetch(`${API_BASE_URL}/api/projects`);
		if (!response.ok) {
			throw new Error(`Failed to fetch projects: ${response.statusText}`);
		}
		return response.json();
	}

	/**
	 * BATCH: Get quests and project metadata for multiple projects
	 */
	async getBatchQuests(projectIds: string[]): Promise<Record<string, { project: any; quests: Quest[] }>> {
		const response = await fetch(
			`${API_BASE_URL}/api/batch/quests?projectIds=${projectIds.join(',')}`
		);
		if (!response.ok) {
			throw new Error(`Failed to fetch batch quests: ${response.statusText}`);
		}
		return response.json();
	}

	/**
	 * BATCH: Get cached progress for multiple projects
	 */
	async getBatchCachedProgress(walletAddress: string, projectIds: string[]): Promise<Record<string, QuestProgress[]>> {
		const response = await fetch(
			`${API_BASE_URL}/api/batch/progress/${walletAddress}?projectIds=${projectIds.join(',')}`
		);
		if (!response.ok) {
			throw new Error(`Failed to fetch batch progress: ${response.statusText}`);
		}
		return response.json();
	}

	/**
	 * BATCH: Refresh progress for multiple projects
	 */
	async batchRefreshProgress(walletAddress: string, projectIds: string[]): Promise<Record<string, QuestProgress[]>> {
		const response = await fetch(
			`${API_BASE_URL}/api/batch/refresh/${walletAddress}?projectIds=${projectIds.join(',')}`,
			{ method: 'POST' }
		);
		if (!response.ok) {
			throw new Error(`Failed to batch refresh progress: ${response.statusText}`);
		}
		return response.json();
	}

	/**
	 * BATCH: Get points for multiple projects
	 */
	async getBatchPointsSummary(walletAddress: string, projectIds?: string[]): Promise<Record<string, PointsSummary>> {
		const url = projectIds
			? `${API_BASE_URL}/api/batch/points/${walletAddress}?projectIds=${projectIds.join(',')}`
			: `${API_BASE_URL}/api/batch/points/${walletAddress}`;

		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Failed to fetch batch points: ${response.statusText}`);
		}
		return response.json();
	}

	/**
	 * Get cached quest progress from Supabase (fast)
	 * Returns only progress data, not full quest objects
	 */
	async getCachedProgress(walletAddress: string, projectId: string): Promise<QuestProgress[]> {
		const response = await fetch(
			`${API_BASE_URL}/api/quests/progress/${walletAddress}?projectId=${projectId}`
		);
		if (!response.ok) {
			throw new Error(`Failed to fetch cached progress: ${response.statusText}`);
		}
		return response.json();
	}

	/**
	 * Refresh quest progress from GraphQL (slower, but up-to-date)
	 * Returns only progress data, not full quest objects
	 */
	async refreshProgress(walletAddress: string, projectId: string): Promise<QuestProgress[]> {
		const response = await fetch(
			`${API_BASE_URL}/api/quests/refresh/${walletAddress}?projectId=${projectId}`,
			{ method: 'POST' }
		);
		if (!response.ok) {
			throw new Error(`Failed to refresh progress: ${response.statusText}`);
		}
		return response.json();
	}

	/**
	 * Get points summary for a wallet
	 */
	async getPointsSummary(
		walletAddress: string,
		projectId?: string
	): Promise<PointsSummary[]> {
		const url = projectId
			? `${API_BASE_URL}/api/points/${walletAddress}?projectId=${projectId}`
			: `${API_BASE_URL}/api/points/${walletAddress}`;

		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Failed to fetch points summary: ${response.statusText}`);
		}
		return response.json();
	}

	/**
	 * Redeem points
	 */
	async redeemPoints(
		walletAddress: string,
		projectId: string,
		amount: number,
		reason: string
	): Promise<PointsSummary> {
		const response = await fetch(`${API_BASE_URL}/api/points/redeem`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				walletAddress,
				projectId,
				amount,
				reason,
			}),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || `Failed to redeem points: ${response.statusText}`);
		}

		return response.json();
	}

	/**
	 * Get transaction history (points earned/redeemed)
	 */
	async getTransactions(
		walletAddress: string,
		projectId?: string
	): Promise<PointsTransaction[]> {
		const url = projectId
			? `${API_BASE_URL}/api/points/transactions/${walletAddress}?projectId=${projectId}`
			: `${API_BASE_URL}/api/points/transactions/${walletAddress}`;

		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Failed to fetch transactions: ${response.statusText}`);
		}
		return response.json();
	}

	/**
	 * Get GraphQL transactions for a wallet (supplies, borrows, etc.)
	 */
	async getGraphQLTransactions(
		walletAddress: string,
		projectId: string
	): Promise<any[]> {
		const url = `${API_BASE_URL}/api/transactions?projectId=${projectId}&walletAddress=${walletAddress}`;

		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Failed to fetch GraphQL transactions: ${response.statusText}`);
		}
		return response.json();
	}
}

export const questApiClient = new QuestApiClient();
