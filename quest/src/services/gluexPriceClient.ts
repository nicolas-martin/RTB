export interface TokenPrice {
	token: string;
	price: number;
	decimals: number;
}

export class GlueXPriceClient {
	private readonly apiUrl = 'https://router-api.gluex.xyz/price';
	private readonly apiKey = import.meta.env.VITE_GLUEX_API_KEY;
	private priceCache: Map<string, { price: number; timestamp: number }> = new Map();
	private readonly cacheTime = 60000; // 1 minute cache

	async getTokenPrice(tokenAddress: string): Promise<number> {
		// Check cache first
		const cached = this.priceCache.get(tokenAddress.toLowerCase());
		if (cached && Date.now() - cached.timestamp < this.cacheTime) {
			return cached.price;
		}

		try {
			const response = await fetch(this.apiUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${this.apiKey}`
				},
				body: JSON.stringify({
					tokenAddress: tokenAddress
				})
			});

			if (!response.ok) {
				console.error(`Failed to fetch price for ${tokenAddress}: ${response.statusText}`);
				return 0;
			}

			const data = await response.json();
			const price = data.price || 0;

			// Cache the result
			this.priceCache.set(tokenAddress.toLowerCase(), {
				price,
				timestamp: Date.now()
			});

			return price;
		} catch (error) {
			console.error(`Error fetching price for ${tokenAddress}:`, error);
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