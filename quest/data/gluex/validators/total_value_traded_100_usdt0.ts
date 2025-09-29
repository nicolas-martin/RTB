import { gluexPriceClient } from '../../../src/services/gluexPriceClient';
import { usePriceStore } from '../../../src/stores/priceStore';

export async function validate(data: any, params?: Record<string, any>): Promise<boolean> {
	if (!data.user?.tokenVolumes || !Array.isArray(data.user.tokenVolumes)) {
		return false;
	}

	// Get configuration from params or use defaults
	const minValueUsdt0 = params?.minValueUsdt0 || 100000000; // 100 USDT0 in 6 decimals
	const baseTokenAddress = params?.baseToken || '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb'; // USDT0

	try {
		const store = usePriceStore.getState();

		// Get unique token addresses from the actual data
		const tokenAddresses = data.user.tokenVolumes.map((tv: any) => tv.token);
		const prices = await gluexPriceClient.getMultipleTokenPrices(tokenAddresses);

		// Calculate total value in base token (USDT0)
		let totalValueInBaseToken = 0;

		for (const tv of data.user.tokenVolumes) {
			const volume = typeof tv.totalVolume === 'string'
				? parseFloat(tv.totalVolume)
				: tv.totalVolume || 0;

			const tokenAddress = tv.token.toLowerCase();

			if (tokenAddress === baseTokenAddress.toLowerCase()) {
				// Direct base token volume
				totalValueInBaseToken += volume;
			} else {
				// Convert other tokens to base token value using price
				const priceInBaseToken = prices.get(tokenAddress) || 0;

				// Get token info from store for decimal handling
				const tokenInfo = store.getTokenInfo(tokenAddress);
				const tokenDecimals = tokenInfo?.decimals || 18; // Default to 18 if unknown
				const baseTokenInfo = store.getTokenInfo(baseTokenAddress);
				const baseTokenDecimals = baseTokenInfo?.decimals || 6; // Default to 6 for USDT0

				// Convert token amount to human-readable, apply price, then convert to base token decimals
				const tokenAmount = volume / Math.pow(10, tokenDecimals);
				const valueInBaseToken = tokenAmount * priceInBaseToken * Math.pow(10, baseTokenDecimals);

				totalValueInBaseToken += valueInBaseToken;
			}
		}

		console.log('Total value in base token:', totalValueInBaseToken, 'Required:', minValueUsdt0);
		console.log('Token volumes processed:', data.user.tokenVolumes.length);

		return totalValueInBaseToken >= minValueUsdt0;
	} catch (error) {
		console.error('Error calculating total value:', error);
		return false;
	}
}
