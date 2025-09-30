import { gluexPriceClient } from '../../../src/services/gluexPriceClient';
import { usePriceStore } from '../../../src/stores/priceStore';

export async function validate(data: any, params?: Record<string, any>): Promise<number> {
	if (!data.swaps || !Array.isArray(data.swaps)) {
		return 0;
	}

	// Get configuration from params or use defaults
	const targetUSD = params?.typeParams?.[0] || 10; // Target in whole USD (e.g., 10 means $10)
	const baseTokenAddress = params?.baseToken || '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb'; // USDT0

	try {
		const store = usePriceStore.getState();

		// Get unique token addresses from the swap data, excluding USDT0
		const tokenAddresses = data.swaps
			.map((swap: any) => swap.inputToken)
			.filter((token: string) => token.toLowerCase() !== baseTokenAddress.toLowerCase())
			.filter((token: string, index: number, arr: string[]) => arr.indexOf(token) === index); // Remove duplicates

		const prices = await gluexPriceClient.getMultipleTokenPrices(tokenAddresses);

		// Calculate total value in USD for all swaps in the last 24h
		let totalValueInUSD = 0;

		for (const swap of data.swaps) {
			const amount = typeof swap.inputAmount === 'string'
				? parseFloat(swap.inputAmount)
				: swap.inputAmount || 0;

			const tokenAddress = swap.inputToken.toLowerCase();

			if (tokenAddress === baseTokenAddress.toLowerCase()) {
				// USDT0: Direct amount in 6 decimals, convert to USD
				const baseTokenInfo = store.getTokenInfo(baseTokenAddress);
				const baseDecimals = baseTokenInfo?.decimals || 6;
				const usdt0Amount = amount / Math.pow(10, baseDecimals);
				totalValueInUSD += usdt0Amount; // USDT0 is 1:1 with USD
				console.log(`USDT0 swap: ${usdt0Amount} USD`);
			} else {
				// Other tokens: Get price and convert
				const priceFromAPI = prices.get(tokenAddress) || 0;

				// Get token info for decimal handling from price store
				const tokenInfo = store.getTokenInfo(tokenAddress);
				const baseTokenInfo = store.getTokenInfo(baseTokenAddress);
				const tokenDecimals = tokenInfo?.decimals || 18;
				const baseTokenDecimals = baseTokenInfo?.decimals || 6;

				// API returns: USDT0_smallest_units / token_smallest_units
				// We have: token amount in smallest units
				// We want: USD value

				// Step 1: Convert token amount to USDT0 smallest units using price
				const usdt0SmallestUnits = amount * priceFromAPI;

				// Step 2: Convert USDT0 smallest units to USD (divide by base token decimals)
				const valueInUSD = usdt0SmallestUnits / Math.pow(10, baseTokenDecimals);

				totalValueInUSD += valueInUSD;
				console.log(`Token ${tokenAddress} swap: ${amount} * ${priceFromAPI} / 10^${baseTokenDecimals} = ${valueInUSD} USD`);
			}
		}

		console.log('Total 24h swap value in USD:', totalValueInUSD);
		console.log('Target USD:', targetUSD);
		console.log('Swaps processed:', data.swaps.length);
		console.log('Type params:', params?.typeParams);

		// Return the USD value directly (not in decimals)
		return totalValueInUSD;
	} catch (error) {
		console.error('Error calculating 24h swap value:', error);
		return 0;
	}
}