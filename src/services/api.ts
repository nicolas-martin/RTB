import axios, { AxiosInstance } from 'axios';
import { Card, DeckAPIResponse } from '../../types';
import { config } from '../config';

class DeckAPI {
	private client: AxiosInstance;

	constructor() {
		this.client = axios.create({
			baseURL: config.API_BASE_URL,
			timeout: config.API_TIMEOUT,
			headers: {
				'Content-Type': 'application/json',
			},
		});

		// Request interceptor for logging
		this.client.interceptors.request.use(
			(config) => {
				// Log API requests in development
				return config;
			},
			(error) => {
				console.error('API Request Error:', error);
				return Promise.reject(error);
			}
		);

		// Response interceptor for error handling
		this.client.interceptors.response.use(
			(response) => response,
			(error) => {
				if (error.response) {
					// Server responded with error status
					console.error('API Response Error:', error.response.data);
				} else if (error.request) {
					// Request made but no response
					console.error('API No Response:', error.request);
				} else {
					// Request setup error
					console.error('API Setup Error:', error.message);
				}
				return Promise.reject(error);
			}
		);
	}

	async drawCards(count: number = 4): Promise<Card[]> {
		try {
			const response = await this.client.get<DeckAPIResponse>(
				`/deck/new/draw/?count=${count}`
			);

			if (!response.data.success) {
				throw new Error('Failed to draw cards from deck');
			}

			return response.data.cards;
		} catch (error) {
			if (axios.isAxiosError(error)) {
				throw new Error(error.message || 'Network error occurred');
			}
			throw error;
		}
	}

	// Add more API methods as needed
	async shuffleDeck(deckId: string): Promise<boolean> {
		try {
			const response = await this.client.get(`/deck/${deckId}/shuffle/`);
			return response.data.success;
		} catch (error) {
			console.error('Shuffle deck error:', error);
			return false;
		}
	}

	async drawFromDeck(deckId: string, count: number = 1): Promise<Card[]> {
		try {
			const response = await this.client.get<DeckAPIResponse>(
				`/deck/${deckId}/draw/?count=${count}`
			);
			return response.data.cards;
		} catch (error) {
			console.error('Draw from deck error:', error);
			return [];
		}
	}
}

export const api = new DeckAPI();
