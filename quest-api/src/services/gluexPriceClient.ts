export interface TokenPrice {
	token: string;
	price: number;
	decimals: number;
}

export class GlueXPriceClient {
	private readonly apiUrl = 'https://exchange-rates.gluex.xyz/';
	private readonly usdt0Address = '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb'; // USDT0 on Plasma
	private priceCache: Map<string, { price: number; timestamp: number }> = new Map();
	private readonly cacheTTL = 5 * 60 * 1000; // 5 minutes

	async getTokenPrice(tokenAddress: string): Promise<number> {
		const normalizedAddress = tokenAddress.toLowerCase();

		// Check cache first
		const cached = this.priceCache.get(normalizedAddress);
		if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
			return cached.price;
		}

		try {
			// For USDT/stablecoins, return 1
			if (normalizedAddress === this.usdt0Address.toLowerCase()) {
				const price = 1;
				this.priceCache.set(normalizedAddress, { price, timestamp: Date.now() });
				return price;
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
				const price = typeof data[0].price === 'number'
					? data[0].price
					: parseFloat(data[0].price) || 0;

				// Cache the result
				this.priceCache.set(normalizedAddress, { price, timestamp: Date.now() });

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
