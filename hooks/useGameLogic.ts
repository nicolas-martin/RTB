import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { CardState, Card } from '../types';
import { api } from '../services/api';

const INITIAL_CARDS: CardState[] = Array(4)
	.fill(null)
	.map(() => ({
		isFlipped: false,
		image: '',
	}));

export const useGameLogic = () => {
	const [cards, setCards] = useState<CardState[]>(INITIAL_CARDS);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const drawCards = useCallback(async () => {
		setLoading(true);
		setError(null);

		try {
			const newCards = await api.drawCards(4);
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

	const flipCard = useCallback((index: number) => {
		setCards((prevCards) => {
			const newCards = [...prevCards];
			if (newCards[index]) {
				newCards[index] = {
					...newCards[index],
					isFlipped: true,
				};
			}
			return newCards;
		});
	}, []);

	const showRules = useCallback(() => {
		Alert.alert(
			'Rules',
			'1. Pick the color. [RED or BLACK]\n\n' +
				'2. Pick the number. [HIGHER or LOWER or SAME]\n\n' +
				'3. Pick the range. [INSIDE or OUTSIDE or SAME]\n\n' +
				'4. Pick the suit.\n    [HEARTS or DIAMONDS or SPADES or CLUBS]'
		);
	}, []);

	return {
		cards,
		loading,
		error,
		drawCards,
		flipCard,
		showRules,
	};
};
