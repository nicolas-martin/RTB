export function getTimestamp24hAgo(): string {
	const now = Math.floor(Date.now() / 1000);
	return String(now - 24 * 60 * 60);
}