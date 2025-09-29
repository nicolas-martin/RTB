import { describe, it, expect } from 'vitest';
import { ConditionalQuest } from '../../../src/models/ConditionalQuest';
import { QuestConfig } from '../../../src/types/quest';

describe('swap_1_usdt0_to_xpl quest', () => {
	const questConfig: QuestConfig = {
		id: 'swap_1_usdt0_to_xpl',
		title: 'Swap 1 USDT0 to XPL',
		description: 'Swap 1 or more USDT0 to XPL',
		reward: 500,
		type: 'conditional',
		query: '',
		conditions: [
			{
				field: 'len(swaps)',
				operator: '>=',
				value: 1
			}
		]
	};

	it('should return true when swaps array has 4 entries', () => {
		const quest = new ConditionalQuest(questConfig);
		const queryResult = {
			swaps: [
				{
					timestamp: "1759164557",
					userAddress: "0xb073d8985c6dee0f89272ac02a5565f9a1684a60",
					inputAmount: "1000000"
				},
				{
					timestamp: "1759166850",
					userAddress: "0xb073d8985c6dee0f89272ac02a5565f9a1684a60",
					inputAmount: "1500000"
				},
				{
					timestamp: "1759166895",
					userAddress: "0xb073d8985c6dee0f89272ac02a5565f9a1684a60",
					inputAmount: "1200000"
				},
				{
					timestamp: "1759169190",
					userAddress: "0xb073d8985c6dee0f89272ac02a5565f9a1684a60",
					inputAmount: "1500000"
				}
			]
		};

		const result = quest.validate(queryResult);
		expect(result.completed).toBe(true);
	});

	it('should return false when swaps array is empty', () => {
		const quest = new ConditionalQuest(questConfig);
		const queryResult = {
			swaps: []
		};

		const result = quest.validate(queryResult);
		expect(result.completed).toBe(false);
	});

	it('should return true when swaps array has exactly 1 entry', () => {
		const quest = new ConditionalQuest(questConfig);
		const queryResult = {
			swaps: [
				{
					timestamp: "1759164557",
					userAddress: "0xb073d8985c6dee0f89272ac02a5565f9a1684a60",
					inputAmount: "1000000"
				}
			]
		};

		const result = quest.validate(queryResult);
		expect(result.completed).toBe(true);
	});

	it('should handle the actual GraphQL response format', () => {
		const quest = new ConditionalQuest(questConfig);
		const queryResult = {
			data: {
				swaps: [
					{
						timestamp: "1759164557",
						userAddress: "0xb073d8985c6dee0f89272ac02a5565f9a1684a60",
						inputAmount: "1000000"
					},
					{
						timestamp: "1759166850",
						userAddress: "0xb073d8985c6dee0f89272ac02a5565f9a1684a60",
						inputAmount: "1500000"
					},
					{
						timestamp: "1759166895",
						userAddress: "0xb073d8985c6dee0f89272ac02a5565f9a1684a60",
						inputAmount: "1200000"
					},
					{
						timestamp: "1759169190",
						userAddress: "0xb073d8985c6dee0f89272ac02a5565f9a1684a60",
						inputAmount: "1500000"
					}
				]
			}
		};

		// Test with nested data structure
		const resultNested = quest.validate(queryResult.data);
		expect(resultNested.completed).toBe(true);
	});
});
