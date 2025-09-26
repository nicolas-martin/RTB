export interface CardState {
	isFlipped: boolean;
	card: Card | null;
}

export interface Card {
	code: string;
	image: string;
	suit: string;
	value: string;
}

export interface DeckAPIResponse {
	success: boolean;
	deck_id: string;
	remaining: number;
	cards: Card[];
}

export interface StageOption {
	value: string;
	label: string;
}

export interface StageConfig {
	id: string;
	title: string;
	options: StageOption[];
}

export type PlayerSelection = string | null;

export interface GameContextType {
	cards: CardState[];
	loading: boolean;
	error: string | null;
	drawCards: () => Promise<void>;
	flipCard: (index: number) => void;
	activeCardIndex: number;
	currentStage: StageConfig | null;
	stages: StageConfig[];
	selections: PlayerSelection[];
	makeSelection: (value: string) => void;
	isRoundComplete: boolean;
	betValue: string;
	setBetValue: (value: string) => void;
	results: (boolean | null)[];
	gameWon: boolean;
	gameLost: boolean;
	hasGameStarted: boolean;
}
