import { describe, it, expect } from 'vitest';
import { validate } from './volume_10_usdt0_24h';

describe('volume_10_usdt0_24h validator', () => {
	const usdt0Address = "0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb";

	it('should return true when USDT0 volume in 24h is >= 10', () => {
		const testData = {
			swaps: [
				{
					timestamp: "1759080450",
					inputAmount: "5000000", // 5 USDT0
					inputToken: usdt0Address
				},
				{
					timestamp: "1759080500",
					inputAmount: "6000000", // 6 USDT0
					inputToken: usdt0Address
				},
				{
					timestamp: "1759080600",
					inputAmount: "2000000", // 2 USDT0 - different token
					inputToken: "0xothertoken"
				}
			]
		};
		expect(validate(testData)).toBe(true); // 5 + 6 = 11 USDT0
	});

	it('should return false when USDT0 volume in 24h is < 10', () => {
		const testData = {
			swaps: [
				{
					timestamp: "1759080450",
					inputAmount: "3000000", // 3 USDT0
					inputToken: usdt0Address
				},
				{
					timestamp: "1759080500",
					inputAmount: "4000000", // 4 USDT0
					inputToken: usdt0Address
				}
			]
		};
		expect(validate(testData)).toBe(false); // 3 + 4 = 7 USDT0
	});

	it('should return false when no swaps exist', () => {
		const testData = {
			swaps: []
		};
		expect(validate(testData)).toBe(false);
	});

	it('should return false when no USDT0 swaps exist', () => {
		const testData = {
			swaps: [
				{
					timestamp: "1759080450",
					inputAmount: "15000000",
					inputToken: "0xothertoken"
				}
			]
		};
		expect(validate(testData)).toBe(false);
	});
});