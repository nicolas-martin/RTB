export interface CardState {
	isFlipped: boolean;
	image: string;
}

export interface Card {
	image: string;
	value: string;
	suit: string;
	code: string;
}

export interface DeckAPIResponse {
	cards: Card[];
	deck_id: string;
	remaining: number;
	success: boolean;
}

export type Orientation = 'portrait' | 'landscape';

export interface GameState {
	cards: CardState[];
	loading: boolean;
	error: string | null;
}

export interface GameContextType extends GameState {
	drawCards: () => Promise<void>;
	flipCard: (index: number) => void;
	showRules: () => void;
}
