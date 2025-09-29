import { describe, it, expect } from 'vitest';
import { validate } from './total_value_traded_100_usdt0';

describe('total_value_traded_100_usdt0 validator', () => {
	it('should return true when total volume is >= 100 USDT0', () => {
		const testData = {
			user: {
				tokenVolumes: [
					{ token: "0xtoken1", totalVolume: "50000000" }, // 50 USDT0
					{ token: "0xtoken2", totalVolume: "60000000" }  // 60 USDT0
				]
			}
		};
		expect(validate(testData)).toBe(true);
	});

	it('should return false when total volume is < 100 USDT0', () => {
		const testData = {
			user: {
				tokenVolumes: [
					{ token: "0xtoken1", totalVolume: "30000000" }, // 30 USDT0
					{ token: "0xtoken2", totalVolume: "40000000" }  // 40 USDT0
				]
			}
		};
		expect(validate(testData)).toBe(false);
	});

	it('should return false when no token volumes exist', () => {
		const testData = {
			user: {
				tokenVolumes: []
			}
		};
		expect(validate(testData)).toBe(false);
	});

	it('should return false when user data is missing', () => {
		const testData = {};
		expect(validate(testData)).toBe(false);
	});
});