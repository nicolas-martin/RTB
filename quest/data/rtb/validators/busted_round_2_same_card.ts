export function validate(data: any, params?: Record<string, any>): boolean {
	if (!data.player?.games || !Array.isArray(data.player.games)) {
		return false;
	}

	return data.player.games.some((game: any) => {
		if (
			game.status !== 'BUSTED' ||
			!game.rounds ||
			game.rounds.length < 2
		) {
			return false;
		}

		const round0 = game.rounds.find((r: any) => r.roundIndex === 0);
		const round1 = game.rounds.find((r: any) => r.roundIndex === 1);

		return (
			round0 &&
			round1 &&
			round0.roundOutcome &&
			round1.roundOutcome &&
			round0.roundOutcome === round1.roundOutcome
		);
	});
}
