export function validate(data: any, params?: Record<string, any>): boolean {
	if (!data.user?.tokenVolumes || !Array.isArray(data.user.tokenVolumes)) {
		return false;
	}

	// Sum all token volumes (assuming they're in USDT0 equivalent)
	// In a real implementation, you'd need to convert each token to USDT0 value
	const totalVolume = data.user.tokenVolumes.reduce((sum: number, tv: any) => {
		const volume = typeof tv.totalVolume === 'string'
			? parseFloat(tv.totalVolume)
			: tv.totalVolume || 0;
		return sum + volume;
	}, 0);

	// Check if total volume is >= 100 USDT0 (100000000 in 6 decimals)
	return totalVolume >= 100000000;
}
