import { usePriceStore } from '../stores/priceStore';

export interface TokenPrice {
	token: string;
	price: number;
	decimals: number;
}

export class GlueXPriceClient {
	private readonly apiUrl = 'https://exchange-rates.gluex.xyz/';
	private readonly usdt0Address = '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb'; // USDT0 on Plume

	async getTokenPrice(tokenAddress: string): Promise<number> {
		const store = usePriceStore.getState();

		// Check cache first
		const cachedPrice = store.getPriceFromCache(tokenAddress);
		if (cachedPrice !== null) {
			return cachedPrice;
		}

		try {
			// For USDT/stablecoins, return 1
			if (tokenAddress.toLowerCase() === '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb') {
				store.setPriceCache(tokenAddress, 1);
				return 1;
			}

			const requestBody = [{
				domestic_blockchain: "plasma",
				domestic_token: tokenAddress,
				foreign_blockchain: "plasma",
				foreign_token: this.usdt0Address
			}];

			const response = await fetch(this.apiUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(requestBody)
			});

			if (!response.ok) {
				console.warn(`Failed to fetch price for ${tokenAddress}: ${response.status} ${response.statusText}`);
				return 0;
			}

			const data = await response.json();

			// The API returns an array, get the first result
			if (Array.isArray(data) && data.length > 0) {
				const price = data[0].price || 0;

				// Cache the result in Zustand store
				store.setPriceCache(tokenAddress, price);

				console.log(`Fetched price for ${tokenAddress}: ${price}`);
				return price;
			} else {
				console.warn(`No price data returned for ${tokenAddress}`);
				return 0;
			}
		} catch (error) {
			// More specific error handling
			if (error instanceof TypeError && error.message.includes('fetch')) {
				console.warn(`🌐 Network error fetching price for ${tokenAddress}. Using fallback price: 0`);
			} else {
				console.warn(`⚠️ Error fetching price for ${tokenAddress}:`, error);
			}
			return 0;
		}
	}

	async getMultipleTokenPrices(tokenAddresses: string[]): Promise<Map<string, number>> {
		const prices = new Map<string, number>();

		// Fetch prices in parallel
		const pricePromises = tokenAddresses.map(async (address) => {
			const price = await this.getTokenPrice(address);
			return { address: address.toLowerCase(), price };
		});

		const results = await Promise.all(pricePromises);
		results.forEach(({ address, price }) => {
			prices.set(address, price);
		});

		return prices;
	}
}

export const gluexPriceClient = new GlueXPriceClient();
