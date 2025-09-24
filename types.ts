export interface CardState {
	isFlipped: boolean;
	image: string;
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

export type Orientation = 'portrait' | 'landscape';

export interface StageOption {
	value: string;
	label: string;
}

export interface StageConfig {
	id: string;
	title: string;
	description: string;
	options: StageOption[];
}

export type PlayerSelection = string | null;

export interface GameContextType {
	cards: CardState[];
	loading: boolean;
	error: string | null;
	drawCards: () => Promise<void>;
	flipCard: (index: number) => void;
	showRules: () => void;
	hideRules: () => void;
	rulesVisible: boolean;
	activeCardIndex: number;
	currentStage: StageConfig | null;
	stages: StageConfig[];
	selections: PlayerSelection[];
	makeSelection: (value: string) => void;
	isRoundComplete: boolean;
}
