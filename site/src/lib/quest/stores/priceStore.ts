import { create } from 'zustand';

interface PriceCache {
	price: number;
	timestamp: number;
}

interface TokenInfo {
	address: string;
	decimals: number;
	symbol: string;
}

interface PriceStore {
	// Price cache
	priceCache: Map<string, PriceCache>;
	setPriceCache: (tokenAddress: string, price: number) => void;
	getPriceFromCache: (tokenAddress: string) => number | null;

	// Token info cache
	tokenInfoCache: Map<string, TokenInfo>;
	setTokenInfo: (tokenAddress: string, info: TokenInfo) => void;
	getTokenInfo: (tokenAddress: string) => TokenInfo | null;

	// Cache management
	clearExpiredCache: () => void;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Initialize with known tokens
const initialTokenInfo = new Map<string, TokenInfo>([
	['0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb', {
		address: '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb',
		decimals: 6,
		symbol: 'USDT0'
	}],
	['0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', {
		address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
		decimals: 18,
		symbol: 'XPL'
	}],
]);

export const usePriceStore = create<PriceStore>((set, get) => ({
	priceCache: new Map(),
	tokenInfoCache: initialTokenInfo,

	setPriceCache: (tokenAddress: string, price: number) => {
		const { priceCache } = get();
		const newCache = new Map(priceCache);
		newCache.set(tokenAddress.toLowerCase(), {
			price,
			timestamp: Date.now()
		});
		set({ priceCache: newCache });
	},

	getPriceFromCache: (tokenAddress: string) => {
		const { priceCache } = get();
		const cached = priceCache.get(tokenAddress.toLowerCase());

		if (!cached) return null;

		// Check if cache is still valid (5 minutes)
		if (Date.now() - cached.timestamp > CACHE_DURATION) {
			return null;
		}

		return cached.price;
	},

	setTokenInfo: (tokenAddress: string, info: TokenInfo) => {
		const { tokenInfoCache } = get();
		const newCache = new Map(tokenInfoCache);
		newCache.set(tokenAddress.toLowerCase(), info);
		set({ tokenInfoCache: newCache });
	},

	getTokenInfo: (tokenAddress: string) => {
		const { tokenInfoCache } = get();
		return tokenInfoCache.get(tokenAddress.toLowerCase()) || null;
	},

	clearExpiredCache: () => {
		const { priceCache } = get();
		const now = Date.now();
		const newCache = new Map();

		for (const [key, value] of priceCache.entries()) {
			if (now - value.timestamp <= CACHE_DURATION) {
				newCache.set(key, value);
			}
		}

		set({ priceCache: newCache });
	}
}));
