import type { NormalizedTransaction } from '../types/quest.js';

/**
 * Normalizes transaction data from various GraphQL responses into a consistent format
 * @param transactionName The name of the transaction type (e.g., "supply", "borrows", "swaps_usdt0")
 * @param rawData The raw GraphQL response data
 * @returns Array of normalized transactions
 */
export function normalizeTransactions(
	transactionName: string,
	rawData: any
): NormalizedTransaction[] {
	if (!rawData || typeof rawData !== 'object') {
		return [];
	}

	// Get the first key in the data object (e.g., "supplies", "borrows", "swaps")
	const dataKey = Object.keys(rawData)[0];
	const items = rawData[dataKey];

	if (!Array.isArray(items) || items.length === 0) {
		return [];
	}

	// Normalize each item based on the transaction type
	return items.map((item: any) => {
		return {
			timestamp: item.timestamp || new Date().toISOString(),
			transaction_type: transactionName,
			amount: extractAmount(item, transactionName),
			points_earned: 0, // Constant for now as requested
			transactionHash: item.transactionHash,
		};
	});
}

/**
 * Extracts the amount from a transaction item based on the transaction type
 */
function extractAmount(item: any, transactionType: string): string {
	// For Aave-style transactions (supply, borrows)
	if (item.amount) {
		return item.amount;
	}

	// For GlueX-style swap transactions
	if (item.inputAmount) {
		return item.inputAmount;
	}

	// Fallback
	return '0';
}
