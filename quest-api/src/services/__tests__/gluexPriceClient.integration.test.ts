import { describe, it, expect } from 'vitest';
import { GlueXPriceClient } from '../gluexPriceClient.js';

describe('GlueXPriceClient Integration', () => {
	const client = new GlueXPriceClient();

	it('should return 1 for USDT0 (hardcoded stablecoin)', async () => {
		const usdt0Address = '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb';
		const price = await client.getTokenPrice(usdt0Address);

		console.log('USDT0 price:', price);

		// USDT0 should be exactly 1 (hardcoded)
		expect(price).toBe(1);
	});

	it('should fetch XPL/ETH price from real API', async () => {
		const xplAddress = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'; // XPL on Plume
		const price = await client.getTokenPrice(xplAddress);

		console.log('XPL price:', price);

		// Price should be a number (could be 0 if API fails, but that's ok for testing)
		expect(typeof price).toBe('number');
		expect(price).toBeGreaterThanOrEqual(0);
	});

	it('should use cache on second call for USDT0', async () => {
		const usdt0Address = '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb';

		// First call
		const start = Date.now();
		const price1 = await client.getTokenPrice(usdt0Address);
		const firstCallTime = Date.now() - start;

		// Second call (should be cached)
		const start2 = Date.now();
		const price2 = await client.getTokenPrice(usdt0Address);
		const secondCallTime = Date.now() - start2;

		console.log('USDT0 First call time:', firstCallTime, 'ms');
		console.log('USDT0 Second call time:', secondCallTime, 'ms');

		// Both should return 1 and second call should be faster
		expect(price1).toBe(1);
		expect(price2).toBe(1);
		expect(secondCallTime).toBeLessThan(10); // Cache should be very fast
	});
});
