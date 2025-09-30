import { gluexPriceClient } from '../../../src/services/gluexPriceClient';
import { usePriceStore } from '../../../src/stores/priceStore';

export async function validate(data: any, params?: Record<string, any>): Promise<number> {
	if (!data.user?.tokenVolumes || !Array.isArray(data.user.tokenVolumes)) {
		return 0;
	}

	// Get configuration from params or use defaults
	const targetUSD = params?.typeParams?.[0] || 100; // Target in whole USD (e.g., 100 means $100)
	const baseTokenAddress = params?.baseToken || '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb'; // USDT0

	try {
		const store = usePriceStore.getState();

		// Get unique token addresses from the actual data, excluding USDT0 (since it's always 1)
		const tokenAddresses = data.user.tokenVolumes
			.map((tv: any) => tv.token)
			.filter((token: string) => token.toLowerCase() !== baseTokenAddress.toLowerCase());

		const prices = await gluexPriceClient.getMultipleTokenPrices(tokenAddresses);

		// Calculate total value in USD (USDT0 equivalent)
		let totalValueInUSD = 0;

		for (const tv of data.user.tokenVolumes) {
			const volume = typeof tv.totalVolume === 'string'
				? parseFloat(tv.totalVolume)
				: tv.totalVolume || 0;

			const tokenAddress = tv.token.toLowerCase();

			if (tokenAddress === baseTokenAddress.toLowerCase()) {
				// USDT0: Direct volume in 6 decimals, convert to USD
				const baseTokenInfo = store.getTokenInfo(baseTokenAddress);
				const baseDecimals = baseTokenInfo?.decimals || 6;
				const usdt0Amount = volume / Math.pow(10, baseDecimals);
				totalValueInUSD += usdt0Amount; // USDT0 is 1:1 with USD
				console.log(`USDT0: ${usdt0Amount} USD`);
			} else {
				// Other tokens: Get price and convert
				const priceFromAPI = prices.get(tokenAddress) || 0;

				// Get token info for decimal handling from price store
				const tokenInfo = store.getTokenInfo(tokenAddress);
				const baseTokenInfo = store.getTokenInfo(baseTokenAddress);
				const tokenDecimals = tokenInfo?.decimals || 18;
				const baseTokenDecimals = baseTokenInfo?.decimals || 6;

				// API returns: USDT0_smallest_units / token_smallest_units
				// We have: token volume in smallest units
				// We want: USD value

				// Step 1: Convert token volume to USDT0 smallest units using price
				const usdt0SmallestUnits = volume * priceFromAPI;

				// Step 2: Convert USDT0 smallest units to USD (divide by base token decimals)
				const valueInUSD = usdt0SmallestUnits / Math.pow(10, baseTokenDecimals);

				totalValueInUSD += valueInUSD;
				console.log(`Token ${tokenAddress}: ${volume} * ${priceFromAPI} / 10^${baseTokenDecimals} = ${valueInUSD} USD`);
			}
		}

		// Convert total USD to USDT0 decimals using the actual base token decimals
		const baseTokenInfo = store.getTokenInfo(baseTokenAddress);
		const baseDecimals = baseTokenInfo?.decimals || 6;
		const totalValueInUsdt0Decimals = totalValueInUSD * Math.pow(10, baseDecimals);

		console.log('Total value in USD:', totalValueInUSD);
		console.log('Target USD:', targetUSD);
		console.log('Token volumes processed:', data.user.tokenVolumes.length);
		console.log('Type params:', params?.typeParams);

		// Return the USD value directly (not in decimals)
		return totalValueInUSD;
	} catch (error) {
		console.error('Error calculating total value:', error);
		return 0;
	}
}
