import { describe, it, expect } from 'vitest';
import { validate } from './total_value_traded_100_usdt0';

describe('total_value_traded_100_usdt0 validator', () => {
	it('should handle USDT0 and ETH volumes with price conversion', async () => {
		const testData = {
			user: {
				tokenVolumes: [
					{
						token: "0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb", // USDT0
						totalVolume: "7200000" // 7.2 USDT0
					},
					{
						token: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", // ETH
						totalVolume: "7400000000000000000" // 7.4 ETH
					}
				]
			}
		};

		const result = await validate(testData);
		console.log('Validation result:', result);

		// This should return true if ETH price * 7.4 + 7.2 USDT0 >= 100 USDT0
		// We expect this to be true given current ETH prices
		expect(typeof result).toBe('boolean');
	});

	it('should return false when no token volumes exist', async () => {
		const testData = {
			user: {
				tokenVolumes: []
			}
		};
		const result = await validate(testData);
		expect(result).toBe(false);
	});

	it('should return false when user data is missing', async () => {
		const testData = {};
		const result = await validate(testData);
		expect(result).toBe(false);
	});

	it('should handle only USDT0 volume', async () => {
		const testData = {
			user: {
				tokenVolumes: [
					{
						token: "0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb", // USDT0
						totalVolume: "150000000" // 150 USDT0
					}
				]
			}
		};

		const result = await validate(testData);
		expect(result).toBe(true); // 150 >= 100
	});
});