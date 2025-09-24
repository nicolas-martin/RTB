import { useState, useCallback, useMemo } from 'react';
import { CardState, Card, StageConfig } from '../types';
import { api } from '../services/api';
import { config } from '../config';

const STAGES: StageConfig[] = [
	{
		id: 'color',
		title: 'Round 1 – Pick the color',
		options: [
			{ value: 'red', label: 'Red' },
			{ value: 'black', label: 'Black' },
		],
	},
	{
		id: 'number',
		title: 'Round 2 – Higher or lower?',
		options: [
			{ value: 'higher', label: 'Higher' },
			{ value: 'lower', label: 'Lower' },
		],
	},
	{
		id: 'range',
		title: 'Round 3 – Inside or outside?',
		options: [
			{ value: 'inside', label: 'Inside' },
			{ value: 'outside', label: 'Outside' },
		],
	},
	{
		id: 'suit',
		title: 'Round 4 – Pick the suit',
		options: [
			{ value: 'hearts', label: 'Hearts' },
			{ value: 'diamonds', label: 'Diamonds' },
			{ value: 'clubs', label: 'Clubs' },
			{ value: 'spades', label: 'Spades' },
		],
	},
];

const CARD_VALUE_MAP: Record<string, number> = {
	ACE: 14,
	KING: 13,
	QUEEN: 12,
	JACK: 11,
};

const redSuits = new Set(['HEARTS', 'DIAMONDS']);

const getCardNumericValue = (card: Card): number => {
	const parsed = Number(card.value);
	if (!Number.isNaN(parsed)) {
		return parsed;
	}
	return CARD_VALUE_MAP[card.value] ?? 0;
};

const evaluateGuess = (
	index: number,
	selection: string,
	cards: CardState[]
): boolean | null => {
	const currentCard = cards[index]?.card;
	if (!currentCard) {
		return null;
	}

	switch (index) {
		case 0: {
			const isRed = redSuits.has(currentCard.suit);
			return (
				(selection === 'red' && isRed) || (selection === 'black' && !isRed)
			);
		}
		case 1: {
			const previousCard = cards[0]?.card;
			if (!previousCard) {
				return null;
			}
			const currentValue = getCardNumericValue(currentCard);
			const previousValue = getCardNumericValue(previousCard);
			if (currentValue === previousValue) {
				return false;
			}
			return selection === 'higher'
				? currentValue > previousValue
				: currentValue < previousValue;
		}
		case 2: {
			const firstCard = cards[0]?.card;
			const secondCard = cards[1]?.card;
			if (!firstCard || !secondCard) {
				return null;
			}
			const low = Math.min(
				getCardNumericValue(firstCard),
				getCardNumericValue(secondCard)
			);
			const high = Math.max(
				getCardNumericValue(firstCard),
				getCardNumericValue(secondCard)
			);
			const currentValue = getCardNumericValue(currentCard);
			if (currentValue === low || currentValue === high) {
				return false;
			}
			const isInside = currentValue > low && currentValue < high;
			return selection === 'inside' ? isInside : !isInside;
		}
		case 3: {
			return selection === currentCard.suit.toLowerCase();
		}
		default:
			return null;
	}
};

const createInitialCards = (): CardState[] =>
	Array(config.CARDS_PER_HAND)
		.fill(null)
		.map(() => ({
			isFlipped: false,
			card: null,
		}));

export const useGameLogic = () => {
	const [cards, setCards] = useState<CardState[]>(createInitialCards());
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [activeCardIndex, setActiveCardIndex] = useState(0);
	const [selections, setSelections] = useState<(string | null)[]>(() =>
		new Array(STAGES.length).fill(null)
	);
	const [rulesVisible, setRulesVisible] = useState(false);
	const [betValue, setBetValue] = useState('');
	const [results, setResults] = useState<(boolean | null)[]>(() =>
		new Array(STAGES.length).fill(null)
	);

	const drawCards = useCallback(async () => {
		setLoading(true);
		setError(null);
		setActiveCardIndex(0);
		setSelections(new Array(STAGES.length).fill(null));
		setRulesVisible(false);
		setCards(createInitialCards());
		setBetValue('');
		setResults(new Array(STAGES.length).fill(null));

		try {
			const newCards = await api.drawCards(config.CARDS_PER_HAND);
			setCards(
				newCards.map((card: Card) => ({
					isFlipped: false,
					card,
				}))
			);
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : 'Failed to draw cards';
			setError(errorMessage);
			console.error('Error drawing cards:', err);
		} finally {
			setLoading(false);
		}
	}, []);

	const flipCard = useCallback(
		(index: number) => {
			if (index !== activeCardIndex) {
				return;
			}
			const selection = selections[index];
			if (!selection) {
				return;
			}

			let flipped = false;
			setCards((prevCards) => {
				const targetCard = prevCards[index];
				if (!targetCard || targetCard.isFlipped) {
					return prevCards;
				}
				const updatedCards = [...prevCards];
				updatedCards[index] = {
					...targetCard,
					isFlipped: true,
				};
				flipped = true;
				return updatedCards;
			});

			if (!flipped) {
				return;
			}

			const guessResult = evaluateGuess(index, selection, cards);
			if (guessResult !== null) {
				setResults((prev) => {
					if (prev[index] === guessResult) {
						return prev;
					}
					const next = [...prev];
					next[index] = guessResult;
					return next;
				});
			}

			setActiveCardIndex((prev) =>
				Math.min(prev + 1, Math.max(cards.length - 1, 0))
			);
			setSelections((prev) => {
				const nextSelections = [...prev];
				const nextIndex = index + 1;
				if (nextIndex < nextSelections.length) {
					nextSelections[nextIndex] = null;
				}
				return nextSelections;
			});
		},
		[activeCardIndex, selections, cards]
	);

	const makeSelection = useCallback(
		(value: string) => {
			if (activeCardIndex >= selections.length) {
				return;
			}
			setSelections((prev) => {
				const updated = [...prev];
				updated[activeCardIndex] = value;
				return updated;
			});
		},
		[activeCardIndex, selections.length]
	);

	const showRules = useCallback(() => {
		setRulesVisible(true);
	}, []);

	const hideRules = useCallback(() => {
		setRulesVisible(false);
	}, []);

	const updateBetValue = useCallback(
		(value: string) => {
			const hasStarted = cards.some((card) => card.isFlipped);
			if (hasStarted) {
				return;
			}
			const sanitized = value.replace(/[^0-9.]/g, '');
			const [whole, ...fractions] = sanitized.split('.');
			const normalized =
				fractions.length > 0 ? `${whole}.${fractions.join('')}` : whole;
			setBetValue(normalized);
		},
		[cards]
	);

	const currentStage = useMemo(() => {
		return activeCardIndex < STAGES.length ? STAGES[activeCardIndex] : null;
	}, [activeCardIndex]);

	const isRoundComplete = useMemo(
		() => cards.length > 0 && cards.every((card) => card.isFlipped),
		[cards]
	);

	const hasGameStarted = useMemo(
		() => cards.some((card) => card.isFlipped),
		[cards]
	);

	const gameLost = useMemo(
		() => results.some((result) => result === false),
		[results]
	);

	const gameWon = useMemo(
		() =>
			results.length === STAGES.length &&
			results.every((result) => result === true) &&
			cards.length > 0 &&
			cards.every((card) => card.isFlipped),
		[results, cards]
	);

	return {
		cards,
		loading,
		error,
		drawCards,
		flipCard,
		showRules,
		hideRules,
		rulesVisible,
		activeCardIndex,
		currentStage,
		stages: STAGES,
		selections,
		makeSelection,
		isRoundComplete,
		betValue,
		setBetValue: updateBetValue,
		results,
		gameWon,
		gameLost,
		hasGameStarted,
	};
};
