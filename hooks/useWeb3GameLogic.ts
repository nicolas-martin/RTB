import { useState, useCallback, useEffect, useMemo } from 'react';
import { contractService } from '../src/services/contractService';
import { useMetaMask } from '../src/contexts/MetaMaskContext';
import { RoundType, CardSuit } from '../src/types/contract';
import { CardState, Card, StageConfig } from '../types';
import { config } from '../src/config';

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

// Convert card from contract format to frontend format
const convertCardFromContract = (cardValue: number): Card => {
	const suit = Math.floor(cardValue / 13);
	const rank = cardValue % 13;

	const suitMap = ['HEARTS', 'DIAMONDS', 'CLUBS', 'SPADES'];
	const valueMap = [
		'2',
		'3',
		'4',
		'5',
		'6',
		'7',
		'8',
		'9',
		'10',
		'JACK',
		'QUEEN',
		'KING',
		'ACE',
	];

	return {
		suit: suitMap[suit],
		value: valueMap[rank],
		code: `${valueMap[rank][0]}${suitMap[suit][0]}`,
		image: '', // We'll generate this if needed
	};
};

// Convert selection to contract format
const convertSelectionToContract = (
	stageIndex: number,
	selection: string
): number | CardSuit => {
	switch (stageIndex) {
		case 0: // Red/Black
			return selection === 'red' ? 0 : 1;
		case 1: // Higher/Lower
			return selection === 'lower' ? 0 : 1;
		case 2: // Inside/Outside
			return selection === 'outside' ? 0 : 1;
		case 3: // Suit
			const suitMap: Record<string, CardSuit> = {
				hearts: CardSuit.Hearts,
				diamonds: CardSuit.Diamonds,
				clubs: CardSuit.Clubs,
				spades: CardSuit.Spades,
			};
			return suitMap[selection];
		default:
			return 0;
	}
};

const createInitialCards = (): CardState[] =>
	Array(config.CARDS_PER_HAND)
		.fill(null)
		.map(() => ({
			isFlipped: false,
			card: null,
		}));

export const useWeb3GameLogic = () => {
	const { account, balance, isConnected } = useMetaMask();

	// Game state
	const [gameId, setGameId] = useState<string | null>(null);
	const [cards, setCards] = useState<CardState[]>(createInitialCards());
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [activeCardIndex, setActiveCardIndex] = useState(0);
	const [selections, setSelections] = useState<(string | null)[]>(() =>
		new Array(STAGES.length).fill(null)
	);
	const [betValue, setBetValue] = useState('');
	const [results, setResults] = useState<(boolean | null)[]>(() =>
		new Array(STAGES.length).fill(null)
	);
	const [currentPayout, setCurrentPayout] = useState<string>('0');
	const [isPlayingRound, setIsPlayingRound] = useState(false);
	const [isCashingOut, setIsCashingOut] = useState(false);

	// Start a new game on the blockchain
	const startGame = useCallback(async () => {
		if (!isConnected || !account) {
			setError('Please connect your wallet first');
			return;
		}

		if (!betValue || parseFloat(betValue) <= 0) {
			setError('Please enter a valid bet amount');
			return;
		}

		setLoading(true);
		setError(null);
		setActiveCardIndex(0);
		setSelections(new Array(STAGES.length).fill(null));
		setCards(createInitialCards());
		setResults(new Array(STAGES.length).fill(null));
		setCurrentPayout(betValue);

		try {
			// Debug: Check house liquidity and max payout before starting
			const houseLiquidity = await contractService.getHouseLiquidity();
			const maxPayout = await contractService.getMaxPayout();
			console.log('House liquidity:', houseLiquidity, 'XPL');
			console.log('Max payout:', maxPayout, 'XPL');
			console.log('Attempting to wager:', betValue, 'XPL');

			if (parseFloat(houseLiquidity) === 0) {
				setError('House has no liquidity. The contract needs to be funded with XPL first.');
				setLoading(false);
				return;
			}

			const newGameId = await contractService.startGame(betValue);
			setGameId(newGameId);

			// Set up event listeners for this game
			contractService.listenToGameEvents(newGameId, {
				onSeedFulfilled: (seed) => {
					console.log('Game seed fulfilled:', seed);
				},
				onRoundPlayed: (roundIndex, card, win, newPayout) => {
					console.log('Round played:', { roundIndex, card, win, newPayout });

					// Update card
					const convertedCard = convertCardFromContract(card);
					setCards((prev) => {
						const updated = [...prev];
						updated[roundIndex] = {
							card: convertedCard,
							isFlipped: true,
						};
						return updated;
					});

					// Update result
					setResults((prev) => {
						const updated = [...prev];
						updated[roundIndex] = win;
						return updated;
					});

					// Update payout
					setCurrentPayout(newPayout);

					// Move to next round if won
					if (win && roundIndex < 3) {
						setActiveCardIndex(roundIndex + 1);
					}
				},
				onCashedOut: (amount) => {
					console.log('Cashed out:', amount);
					setCurrentPayout(amount);
				},
				onBusted: () => {
					console.log('Busted!');
					setCurrentPayout('0');
				},
			});
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : 'Failed to start game';
			setError(errorMessage);
			console.error('Error starting game:', err);
		} finally {
			setLoading(false);
		}
	}, [isConnected, account, betValue]);

	// Play a round on the blockchain
	const playRound = useCallback(async () => {
		if (!gameId || !isConnected) {
			setError('No active game');
			return;
		}

		const selection = selections[activeCardIndex];
		if (!selection) {
			setError('Please make a selection first');
			return;
		}

		setIsPlayingRound(true);
		setError(null);

		try {
			const roundType = activeCardIndex as RoundType;
			const choice = convertSelectionToContract(activeCardIndex, selection);

			const win = await contractService.playRound(gameId, roundType, choice);

			// The event listeners will handle updating the UI
			// Just handle the loading state here
			if (!win) {
				// Game lost
				setGameId(null);
			}
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : 'Failed to play round';
			setError(errorMessage);
			console.error('Error playing round:', err);
		} finally {
			setIsPlayingRound(false);
		}
	}, [gameId, isConnected, activeCardIndex, selections]);

	// Cash out winnings
	const cashOut = useCallback(async () => {
		if (!gameId || !isConnected) {
			setError('No active game to cash out');
			return;
		}

		setIsCashingOut(true);
		setError(null);

		try {
			const amount = await contractService.cashOut(gameId);
			setCurrentPayout(amount);
			setGameId(null);
			// Reset game state
			setActiveCardIndex(0);
			setSelections(new Array(STAGES.length).fill(null));
			setBetValue('');
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : 'Failed to cash out';
			setError(errorMessage);
			console.error('Error cashing out:', err);
		} finally {
			setIsCashingOut(false);
		}
	}, [gameId, isConnected]);

	// Wrapper for flipCard that plays the round on blockchain
	const flipCard = useCallback(
		(index: number) => {
			if (index !== activeCardIndex) {
				return;
			}
			const selection = selections[index];
			if (!selection) {
				return;
			}

			// Play the round on blockchain
			playRound();
		},
		[activeCardIndex, selections, playRound]
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

	const updateBetValue = useCallback(
		(value: string) => {
			if (gameId) {
				// Can't change bet during game
				return;
			}
			const sanitized = value.replace(/[^0-9.]/g, '');
			const [whole, ...fractions] = sanitized.split('.');
			const normalized =
				fractions.length > 0 ? `${whole}.${fractions.join('')}` : whole;
			setBetValue(normalized);
		},
		[gameId]
	);

	// Clean up listeners when game ends
	useEffect(() => {
		return () => {
			if (gameId) {
				contractService.removeAllListeners();
			}
		};
	}, [gameId]);

	const currentStage = useMemo(() => {
		return activeCardIndex < STAGES.length ? STAGES[activeCardIndex] : null;
	}, [activeCardIndex]);

	const isRoundComplete = useMemo(
		() => cards.length > 0 && cards.every((card) => card.isFlipped),
		[cards]
	);

	const hasGameStarted = useMemo(
		() => gameId !== null,
		[gameId]
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
		// Web3 specific
		account,
		balance,
		isConnected,
		gameId,
		currentPayout,
		startGame,
		cashOut,
		isCashingOut,
		isPlayingRound,

		// Original game logic
		cards,
		loading,
		error,
		drawCards: startGame, // Map drawCards to startGame for compatibility
		flipCard,
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
