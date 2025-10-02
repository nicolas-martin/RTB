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

		// Should return a number (progress)
		expect(typeof result).toBe('number');
		expect(result).toBeGreaterThan(0);
	});

	it('should return 0 when no token volumes exist', async () => {
		const testData = {
			user: {
				tokenVolumes: []
			}
		};
		const result = await validate(testData);
		expect(result).toBe(0);
	});

	it('should return 0 when user data is missing', async () => {
		const testData = {};
		const result = await validate(testData);
		expect(result).toBe(0);
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
		expect(result).toBe(150000000); // 150 USDT0 in decimals
	});
});