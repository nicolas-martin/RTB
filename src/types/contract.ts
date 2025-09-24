export enum RoundType {
	RedBlack = 0,
	HigherLower = 1,
	InsideOutside = 2,
	Suit = 3,
}

export interface RoundConfig {
	rtype: RoundType;
	multiplierBps: number;
}

export interface Game {
	player: string;
	token: string;
	wager: bigint;
	currentPayout: bigint;
	startedAt: bigint;
	roundIndex: number;
	usedMaskLo: bigint;
	usedMaskHi: bigint;
	seed: string;
	live: boolean;
	ended: boolean;
	deadline: number;
	lastRank1: number;
	lastRank2: number;
}

export enum CardSuit {
	Hearts = 0,
	Diamonds = 1,
	Clubs = 2,
	Spades = 3,
}

export enum RoundChoice {
	RedBlackRed = 0,
	RedBlackBlack = 1,
	HigherLowerLower = 2,
	HigherLowerHigher = 3,
	InsideOutsideOutside = 4,
	InsideOutsideInside = 5,
}
