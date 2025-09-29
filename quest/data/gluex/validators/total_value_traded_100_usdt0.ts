import { gluexPriceClient } from '../../../src/services/gluexPriceClient';

export async function validate(data: any, params?: Record<string, any>): Promise<boolean> {
	if (!data.user?.tokenVolumes || !Array.isArray(data.user.tokenVolumes)) {
		return false;
	}

	const usdt0Address = '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb';
	const minValueUsdt0 = 100000000; // 100 USDT0 in 6 decimals

	try {
		// Get unique token addresses
		const tokenAddresses = data.user.tokenVolumes.map((tv: any) => tv.token);
		const prices = await gluexPriceClient.getMultipleTokenPrices(tokenAddresses);

		// Calculate total value in USDT0
		let totalValueInUsdt0 = 0;

		for (const tv of data.user.tokenVolumes) {
			const volume = typeof tv.totalVolume === 'string'
				? parseFloat(tv.totalVolume)
				: tv.totalVolume || 0;

			const tokenAddress = tv.token.toLowerCase();

			if (tokenAddress === usdt0Address.toLowerCase()) {
				// Direct USDT0 volume
				totalValueInUsdt0 += volume;
			} else {
				// Convert other tokens to USDT0 value using price
				const priceInUsdt0 = prices.get(tokenAddress) || 0;

				// For ETH (18 decimals), need to adjust
				if (tokenAddress === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
					// ETH has 18 decimals, USDT0 has 6 decimals
					const ethAmount = volume / Math.pow(10, 18);
					totalValueInUsdt0 += ethAmount * priceInUsdt0 * Math.pow(10, 6);
				} else {
					// Assume 6 decimals for other tokens
					totalValueInUsdt0 += volume * priceInUsdt0;
				}
			}
		}

		console.log('Total value in USDT0:', totalValueInUsdt0, 'Required:', minValueUsdt0);
		return totalValueInUsdt0 >= minValueUsdt0;
	} catch (error) {
		console.error('Error calculating total value:', error);
		return false;
	}
}
