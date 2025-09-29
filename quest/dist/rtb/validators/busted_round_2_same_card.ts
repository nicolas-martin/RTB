export function validate(data: any, _params?: Record<string, any>): boolean {
	if (!data.player?.games || !Array.isArray(data.player.games)) {
		return false;
	}

	return data.player.games.some((game: any) => {
		if (
			game.status !== 'BUSTED' || !game.rounds || game.rounds.length < 2
		) {
			return false;
		}

		const round0 = game.rounds.find((r: any) => r.roundIndex === 0);
		const round1 = game.rounds.find((r: any) => r.roundIndex === 1);

		if (!round0?.roundOutcome || !round1?.roundOutcome) {
			return false;
		}

		const rank0 = round0.roundOutcome.slice(0, -1);
		const rank1 = round1.roundOutcome.slice(0, -1);

		return rank0 === rank1;
	});
}
