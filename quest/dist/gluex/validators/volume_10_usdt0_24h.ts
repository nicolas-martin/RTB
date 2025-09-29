export function validate(data: any, params?: Record<string, any>): boolean {
	if (!data.swaps || !Array.isArray(data.swaps)) {
		return false;
	}

	const usdt0Address = params?.usdt0Address || "0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb";
	const minValueUsdt0 = params?.minValueUsdt0 || 10000000; // 10 USDT0 in 6 decimals

	// Calculate total volume of swaps in the last 24h
	// For simplicity, we'll assume all swaps with USDT0 as input token count toward the volume
	const totalVolume = data.swaps.reduce((sum: number, swap: any) => {
		if (swap.inputToken?.toLowerCase() === usdt0Address.toLowerCase()) {
			const amount = typeof swap.inputAmount === 'string'
				? parseFloat(swap.inputAmount)
				: swap.inputAmount || 0;
			return sum + amount;
		}
		return sum;
	}, 0);

	return totalVolume >= minValueUsdt0;
}