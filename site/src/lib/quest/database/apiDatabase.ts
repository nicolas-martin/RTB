import type {
	IQuestDatabase,
	QuestCompletion,
	QuestCompletionFilter,
	UserPoints,
	UserPointsFilter,
} from './types';

/**
 * API-based database implementation for production use
 * This will make HTTP requests to your backend server
 */
export class ApiDatabase implements IQuestDatabase {
	private apiEndpoint: string = '';
	private apiKey: string = '';
	private timeout: number = 5000;

	/**
	 * Initialize the API database with configuration
	 * @param config - Configuration object with apiEndpoint, apiKey, and timeout
	 */
	async initialize(config: {
		apiEndpoint: string;
		apiKey?: string;
		timeout?: number;
	}): Promise<void> {
		this.apiEndpoint = config.apiEndpoint;
		this.apiKey = config.apiKey || '';
		this.timeout = config.timeout || 5000;
		console.log('[ApiDatabase] Initialized with endpoint:', this.apiEndpoint);
	}

	/**
	 * Health check for the API connection
	 */
	async healthCheck(): Promise<boolean> {
		try {
			const response = await fetch(`${this.apiEndpoint}/health`, {
				method: 'GET',
				headers: this.getHeaders(),
				signal: AbortSignal.timeout(this.timeout),
			});
			return response.ok;
		} catch (error) {
			console.error('[ApiDatabase] Health check failed:', error);
			return false;
		}
	}

	async getQuestCompletion(
		userAddress: string,
		questId: string,
		projectId: string
	): Promise<QuestCompletion | null> {
		try {
			const params = new URLSearchParams({ userAddress, questId, projectId });
			const response = await fetch(
				`${this.apiEndpoint}/quest-completions?${params}`,
				{
					method: 'GET',
					headers: this.getHeaders(),
					signal: AbortSignal.timeout(this.timeout),
				}
			);

			if (!response.ok) {
				if (response.status === 404) return null;
				throw new Error(`API error: ${response.status}`);
			}

			return await response.json();
		} catch (error) {
			console.error('[ApiDatabase] Error getting quest completion:', error);
			throw error;
		}
	}

	async getQuestCompletions(
		filter: QuestCompletionFilter
	): Promise<QuestCompletion[]> {
		try {
			const params = new URLSearchParams(
				Object.entries(filter)
					.filter(([_, value]) => value !== undefined)
					.map(([key, value]) => [key, String(value)])
			);
			const response = await fetch(
				`${this.apiEndpoint}/quest-completions?${params}`,
				{
					method: 'GET',
					headers: this.getHeaders(),
					signal: AbortSignal.timeout(this.timeout),
				}
			);

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}

			return await response.json();
		} catch (error) {
			console.error('[ApiDatabase] Error getting quest completions:', error);
			throw error;
		}
	}

	async saveQuestCompletion(completion: QuestCompletion): Promise<void> {
		try {
			const response = await fetch(`${this.apiEndpoint}/quest-completions`, {
				method: 'POST',
				headers: this.getHeaders(),
				body: JSON.stringify(completion),
				signal: AbortSignal.timeout(this.timeout),
			});

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}
		} catch (error) {
			console.error('[ApiDatabase] Error saving quest completion:', error);
			throw error;
		}
	}

	async updateQuestCompletion(
		userAddress: string,
		questId: string,
		projectId: string,
		updates: Partial<QuestCompletion>
	): Promise<void> {
		try {
			const response = await fetch(
				`${this.apiEndpoint}/quest-completions/${userAddress}/${projectId}/${questId}`,
				{
					method: 'PATCH',
					headers: this.getHeaders(),
					body: JSON.stringify(updates),
					signal: AbortSignal.timeout(this.timeout),
				}
			);

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}
		} catch (error) {
			console.error('[ApiDatabase] Error updating quest completion:', error);
			throw error;
		}
	}

	async getUserPoints(
		userAddress: string,
		projectId: string
	): Promise<UserPoints | null> {
		try {
			const response = await fetch(
				`${this.apiEndpoint}/user-points/${userAddress}/${projectId}`,
				{
					method: 'GET',
					headers: this.getHeaders(),
					signal: AbortSignal.timeout(this.timeout),
				}
			);

			if (!response.ok) {
				if (response.status === 404) return null;
				throw new Error(`API error: ${response.status}`);
			}

			return await response.json();
		} catch (error) {
			console.error('[ApiDatabase] Error getting user points:', error);
			throw error;
		}
	}

	async getAllUserPoints(filter: UserPointsFilter): Promise<UserPoints[]> {
		try {
			const params = new URLSearchParams(
				Object.entries(filter)
					.filter(([_, value]) => value !== undefined)
					.map(([key, value]) => [key, String(value)])
			);
			const response = await fetch(`${this.apiEndpoint}/user-points?${params}`, {
				method: 'GET',
				headers: this.getHeaders(),
				signal: AbortSignal.timeout(this.timeout),
			});

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}

			return await response.json();
		} catch (error) {
			console.error('[ApiDatabase] Error getting all user points:', error);
			throw error;
		}
	}

	async saveUserPoints(points: UserPoints): Promise<void> {
		try {
			const response = await fetch(`${this.apiEndpoint}/user-points`, {
				method: 'POST',
				headers: this.getHeaders(),
				body: JSON.stringify(points),
				signal: AbortSignal.timeout(this.timeout),
			});

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}
		} catch (error) {
			console.error('[ApiDatabase] Error saving user points:', error);
			throw error;
		}
	}

	async updateUserPoints(
		userAddress: string,
		projectId: string,
		pointsDelta: number
	): Promise<void> {
		try {
			const response = await fetch(
				`${this.apiEndpoint}/user-points/${userAddress}/${projectId}`,
				{
					method: 'PATCH',
					headers: this.getHeaders(),
					body: JSON.stringify({ pointsDelta }),
					signal: AbortSignal.timeout(this.timeout),
				}
			);

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}
		} catch (error) {
			console.error('[ApiDatabase] Error updating user points:', error);
			throw error;
		}
	}

	async clearUserData(userAddress: string, projectId?: string): Promise<void> {
		try {
			const url = projectId
				? `${this.apiEndpoint}/users/${userAddress}/projects/${projectId}`
				: `${this.apiEndpoint}/users/${userAddress}`;

			const response = await fetch(url, {
				method: 'DELETE',
				headers: this.getHeaders(),
				signal: AbortSignal.timeout(this.timeout),
			});

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}
		} catch (error) {
			console.error('[ApiDatabase] Error clearing user data:', error);
			throw error;
		}
	}

	async clearAllData(): Promise<void> {
		try {
			const response = await fetch(`${this.apiEndpoint}/clear-all`, {
				method: 'DELETE',
				headers: this.getHeaders(),
				signal: AbortSignal.timeout(this.timeout),
			});

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}
		} catch (error) {
			console.error('[ApiDatabase] Error clearing all data:', error);
			throw error;
		}
	}

	private getHeaders(): HeadersInit {
		const headers: HeadersInit = {
			'Content-Type': 'application/json',
		};

		if (this.apiKey) {
			headers['Authorization'] = `Bearer ${this.apiKey}`;
		}

		return headers;
	}
}
