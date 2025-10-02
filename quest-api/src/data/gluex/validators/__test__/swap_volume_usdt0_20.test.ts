import { describe, it, expect } from 'vitest';
import { ProgressQuest } from '@/models/ProgressQuest.js';
import { QuestConfig } from '@/types/quest.js';

describe('swap_volume_usdt0_20 quest', () => {
	const questConfig: QuestConfig = {
		id: 'swap_volume_usdt0_20',
		title: 'Swap TotalVolume of USDT0 All time ≥ 20',
		description: 'Trade 20 or more USDT0 all time',
		reward: 1500,
		type: 'progress',
		query: '',
		conditions: [
			{
				field: 'user.tokenVolumes[0].totalVolume',
				operator: '>=',
				value: 720000
			}
		]
	};

	it('should handle array index notation and return true when volume >= 720000', () => {
		const quest = new ProgressQuest(questConfig);
		const queryResult = {
			user: {
				tokenVolumes: [
					{
						token: "0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb",
						totalVolume: "7200000"
					}
				]
			}
		};

		const result = quest.validate(queryResult);
		console.log('Result:', result);
		expect(result.completed).toBe(true);
		expect(result.progress).toBe(7200000);
	});

	it('should handle actual GraphQL response format', () => {
		const quest = new ProgressQuest(questConfig);
		const queryResult = {
			data: {
				user: {
					tokenVolumes: [
						{
							token: "0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb",
							totalVolume: "7200000"
						}
					]
				}
			}
		};

		// Test with nested data structure
		const result = quest.validate(queryResult.data);
		expect(result.completed).toBe(true);
		expect(result.progress).toBe(7200000);
	});

	it('should return false when volume < 720000', () => {
		const quest = new ProgressQuest(questConfig);
		const queryResult = {
			user: {
				tokenVolumes: [
					{
						token: "0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb",
						totalVolume: "500000"
					}
				]
			}
		};

		const result = quest.validate(queryResult);
		expect(result.completed).toBe(false);
		expect(result.progress).toBe(500000);
	});

	it('should handle empty tokenVolumes array', () => {
		const quest = new ProgressQuest(questConfig);
		const queryResult = {
			user: {
				tokenVolumes: []
			}
		};

		const result = quest.validate(queryResult);
		expect(result.completed).toBe(false);
		expect(result.progress).toBe(0);
	});

	it('should handle missing user data', () => {
		const quest = new ProgressQuest(questConfig);
		const queryResult = {};

		const result = quest.validate(queryResult);
		expect(result.completed).toBe(false);
		expect(result.progress).toBe(0);
	});
});