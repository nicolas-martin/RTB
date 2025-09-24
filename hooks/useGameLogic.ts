import { useState, useCallback, useMemo } from 'react';
import { CardState, Card, StageConfig } from '../types';
import { api } from '../services/api';
import { config } from '../config';

const STAGES: StageConfig[] = [
	{
		id: 'color',
		title: 'Round 1 – Pick the color',
		description: 'Choose whether the next card will be red or black.',
		options: [
			{ value: 'red', label: 'Red' },
			{ value: 'black', label: 'Black' },
		],
	},
	{
		id: 'number',
		title: 'Round 2 – Higher, lower, or same?',
		description:
			'Decide if the next card will be higher, lower, or exactly the same as the previous card.',
		options: [
			{ value: 'higher', label: 'Higher' },
			{ value: 'lower', label: 'Lower' },
			{ value: 'same-number', label: 'Same' },
		],
	},
	{
		id: 'range',
		title: 'Round 3 – Inside, outside, or same?',
		description:
			'Will the next card land inside, outside, or match the range of the first two cards?',
		options: [
			{ value: 'inside', label: 'Inside' },
			{ value: 'outside', label: 'Outside' },
			{ value: 'same-range', label: 'Same' },
		],
	},
	{
		id: 'suit',
		title: 'Round 4 – Pick the suit',
		description: 'Choose the suit you think the final card will be.',
		options: [
			{ value: 'hearts', label: 'Hearts' },
			{ value: 'diamonds', label: 'Diamonds' },
			{ value: 'clubs', label: 'Clubs' },
			{ value: 'spades', label: 'Spades' },
		],
	},
];

const createInitialCards = (): CardState[] =>
	Array(config.CARDS_PER_HAND)
		.fill(null)
		.map(() => ({
			isFlipped: false,
			image: '',
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

	const drawCards = useCallback(async () => {
		setLoading(true);
		setError(null);
		setActiveCardIndex(0);
		setSelections(new Array(STAGES.length).fill(null));
		setRulesVisible(false);
		setCards(createInitialCards());

		try {
			const newCards = await api.drawCards(config.CARDS_PER_HAND);
			setCards(
				newCards.map((card: Card) => ({
					isFlipped: false,
					image: card.image,
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
			setCards((prevCards) => {
				if (index !== activeCardIndex) {
					return prevCards;
				}
				const targetCard = prevCards[index];
				const selection = selections[index];
				if (!targetCard || targetCard.isFlipped || !selection) {
					return prevCards;
				}
				const updatedCards = [...prevCards];
				updatedCards[index] = {
					...targetCard,
					isFlipped: true,
				};
				return updatedCards;
			});

			if (index === activeCardIndex && selections[index]) {
				setActiveCardIndex((prev) => Math.min(prev + 1, cards.length));
				setSelections((prev) => {
					const nextSelections = [...prev];
					const nextIndex = index + 1;
					if (nextIndex < nextSelections.length) {
						nextSelections[nextIndex] = null;
					}
					return nextSelections;
				});
			}
		},
		[activeCardIndex, selections, cards.length]
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

	const currentStage = useMemo(() => {
		return activeCardIndex < STAGES.length ? STAGES[activeCardIndex] : null;
	}, [activeCardIndex]);

	const isRoundComplete = useMemo(
		() => cards.length > 0 && cards.every((card) => card.isFlipped),
		[cards]
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
	};
};
