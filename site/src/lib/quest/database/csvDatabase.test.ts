/**
 * Tests for CSV Database Implementation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CSVDatabase } from './csvDatabase';
import type { QuestCompletion, UserPoints } from './types';

// Mock localStorage for Node.js test environment
const localStorageMock = (() => {
	let store: Record<string, string> = {};

	return {
		getItem(key: string) {
			return store[key] || null;
		},
		setItem(key: string, value: string) {
			store[key] = value.toString();
		},
		removeItem(key: string) {
			delete store[key];
		},
		clear() {
			store = {};
		},
		key(index: number) {
			const keys = Object.keys(store);
			return keys[index] || null;
		},
		get length() {
			return Object.keys(store).length;
		},
	};
})();

// Set up global localStorage mock
global.localStorage = localStorageMock as Storage;

describe('CSVDatabase', () => {
	let db: CSVDatabase;

	beforeEach(() => {
		db = new CSVDatabase();
		// Clear localStorage before each test
		localStorage.clear();
	});

	afterEach(async () => {
		// Clean up after each test
		await db.clearAllData();
	});

	describe('Quest Completions', () => {
		it('should save and retrieve a quest completion', async () => {
			const completion: QuestCompletion = {
				userAddress: '0x123',
				questId: 'quest1',
				projectId: 'project1',
				completed: true,
				progress: 100,
				completedAt: '2025-01-01T00:00:00Z',
				lastCheckedAt: '2025-01-01T00:00:00Z',
			};

			await db.saveQuestCompletion(completion);

			const retrieved = await db.getQuestCompletion(
				'0x123',
				'quest1',
				'project1'
			);

			expect(retrieved).toEqual(completion);
		});

		it('should return null for non-existent completion', async () => {
			const retrieved = await db.getQuestCompletion(
				'0x999',
				'quest999',
				'project999'
			);

			expect(retrieved).toBeNull();
		});

		it('should update existing quest completion', async () => {
			const completion: QuestCompletion = {
				userAddress: '0x123',
				questId: 'quest1',
				projectId: 'project1',
				completed: false,
				progress: 50,
				lastCheckedAt: '2025-01-01T00:00:00Z',
			};

			await db.saveQuestCompletion(completion);

			// Update to completed
			await db.updateQuestCompletion('0x123', 'quest1', 'project1', {
				completed: true,
				progress: 100,
				completedAt: '2025-01-02T00:00:00Z',
			});

			const retrieved = await db.getQuestCompletion(
				'0x123',
				'quest1',
				'project1'
			);

			expect(retrieved?.completed).toBe(true);
			expect(retrieved?.progress).toBe(100);
			expect(retrieved?.completedAt).toBe('2025-01-02T00:00:00Z');
		});

		it('should filter completions by user address', async () => {
			await db.saveQuestCompletion({
				userAddress: '0x123',
				questId: 'quest1',
				projectId: 'project1',
				completed: true,
				lastCheckedAt: '2025-01-01T00:00:00Z',
			});

			await db.saveQuestCompletion({
				userAddress: '0x456',
				questId: 'quest2',
				projectId: 'project1',
				completed: true,
				lastCheckedAt: '2025-01-01T00:00:00Z',
			});

			const completions = await db.getQuestCompletions({
				userAddress: '0x123',
			});

			expect(completions).toHaveLength(1);
			expect(completions[0].userAddress).toBe('0x123');
		});

		it('should filter completions by completed status', async () => {
			await db.saveQuestCompletion({
				userAddress: '0x123',
				questId: 'quest1',
				projectId: 'project1',
				completed: true,
				lastCheckedAt: '2025-01-01T00:00:00Z',
			});

			await db.saveQuestCompletion({
				userAddress: '0x123',
				questId: 'quest2',
				projectId: 'project1',
				completed: false,
				progress: 50,
				lastCheckedAt: '2025-01-01T00:00:00Z',
			});

			const completedOnly = await db.getQuestCompletions({
				userAddress: '0x123',
				completed: true,
			});

			expect(completedOnly).toHaveLength(1);
			expect(completedOnly[0].questId).toBe('quest1');
		});
	});

	describe('User Points', () => {
		it('should save and retrieve user points', async () => {
			const points: UserPoints = {
				userAddress: '0x123',
				projectId: 'project1',
				totalPoints: 1000,
				lastUpdatedAt: '2025-01-01T00:00:00Z',
			};

			await db.saveUserPoints(points);

			const retrieved = await db.getUserPoints('0x123', 'project1');

			expect(retrieved).toEqual(points);
		});

		it('should update user points with delta', async () => {
			const points: UserPoints = {
				userAddress: '0x123',
				projectId: 'project1',
				totalPoints: 1000,
				lastUpdatedAt: '2025-01-01T00:00:00Z',
			};

			await db.saveUserPoints(points);

			// Add 500 more points
			await db.updateUserPoints('0x123', 'project1', 500);

			const retrieved = await db.getUserPoints('0x123', 'project1');

			expect(retrieved?.totalPoints).toBe(1500);
		});

		it('should create new points record if user does not exist', async () => {
			await db.updateUserPoints('0x123', 'project1', 1000);

			const retrieved = await db.getUserPoints('0x123', 'project1');

			expect(retrieved?.totalPoints).toBe(1000);
		});

		it('should get all user points for a project', async () => {
			await db.saveUserPoints({
				userAddress: '0x123',
				projectId: 'project1',
				totalPoints: 1000,
				lastUpdatedAt: '2025-01-01T00:00:00Z',
			});

			await db.saveUserPoints({
				userAddress: '0x456',
				projectId: 'project1',
				totalPoints: 2000,
				lastUpdatedAt: '2025-01-01T00:00:00Z',
			});

			await db.saveUserPoints({
				userAddress: '0x789',
				projectId: 'project2',
				totalPoints: 3000,
				lastUpdatedAt: '2025-01-01T00:00:00Z',
			});

			const projectPoints = await db.getAllUserPoints({
				projectId: 'project1',
			});

			expect(projectPoints).toHaveLength(2);
		});
	});

	describe('Clear Operations', () => {
		it('should clear all user data for a specific project', async () => {
			await db.saveQuestCompletion({
				userAddress: '0x123',
				questId: 'quest1',
				projectId: 'project1',
				completed: true,
				lastCheckedAt: '2025-01-01T00:00:00Z',
			});

			await db.saveQuestCompletion({
				userAddress: '0x123',
				questId: 'quest2',
				projectId: 'project2',
				completed: true,
				lastCheckedAt: '2025-01-01T00:00:00Z',
			});

			await db.saveUserPoints({
				userAddress: '0x123',
				projectId: 'project1',
				totalPoints: 1000,
				lastUpdatedAt: '2025-01-01T00:00:00Z',
			});

			// Clear only project1 data
			await db.clearUserData('0x123', 'project1');

			const completions = await db.getQuestCompletions({
				userAddress: '0x123',
			});
			const points = await db.getUserPoints('0x123', 'project1');

			expect(completions).toHaveLength(1);
			expect(completions[0].projectId).toBe('project2');
			expect(points).toBeNull();
		});

		it('should clear all user data across all projects', async () => {
			await db.saveQuestCompletion({
				userAddress: '0x123',
				questId: 'quest1',
				projectId: 'project1',
				completed: true,
				lastCheckedAt: '2025-01-01T00:00:00Z',
			});

			await db.saveQuestCompletion({
				userAddress: '0x123',
				questId: 'quest2',
				projectId: 'project2',
				completed: true,
				lastCheckedAt: '2025-01-01T00:00:00Z',
			});

			await db.clearUserData('0x123');

			const completions = await db.getQuestCompletions({
				userAddress: '0x123',
			});

			expect(completions).toHaveLength(0);
		});

		it('should clear all data', async () => {
			await db.saveQuestCompletion({
				userAddress: '0x123',
				questId: 'quest1',
				projectId: 'project1',
				completed: true,
				lastCheckedAt: '2025-01-01T00:00:00Z',
			});

			await db.saveUserPoints({
				userAddress: '0x123',
				projectId: 'project1',
				totalPoints: 1000,
				lastUpdatedAt: '2025-01-01T00:00:00Z',
			});

			await db.clearAllData();

			const completions = await db.getQuestCompletions({});
			const points = await db.getAllUserPoints({});

			expect(completions).toHaveLength(0);
			expect(points).toHaveLength(0);
		});
	});
});
