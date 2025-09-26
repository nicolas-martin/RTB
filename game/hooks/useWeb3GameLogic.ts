import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
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
const convertCardFromContract = (cardValue: number | bigint): Card => {
	// Convert BigInt to number if needed
	const value = typeof cardValue === 'bigint' ? Number(cardValue) : cardValue;
	const suit = Math.floor(value / 13);
	const rank = value % 13;

	const suitMap = ['HEARTS', 'DIAMONDS', 'CLUBS', 'SPADES'];
	const suitSymbolMap = ['H', 'D', 'C', 'S'];
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
	const codeMap = [
		'2',
		'3',
		'4',
		'5',
		'6',
		'7',
		'8',
		'9',
		'0', // 10 is represented as 0
		'J',
		'Q',
		'K',
		'A',
	];

	const cardCode = `${codeMap[rank]}${suitSymbolMap[suit]}`;

	return {
		suit: suitMap[suit],
		value: valueMap[rank],
		code: cardCode,
		image: `https://deckofcardsapi.com/static/img/${cardCode}.png`,
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
	const selectionsRef = useRef<(string | null)[]>(
		new Array(STAGES.length).fill(null)
	);
	const [betValue, setBetValue] = useState('');
	const [results, setResults] = useState<(boolean | null)[]>(() =>
		new Array(STAGES.length).fill(null)
	);
	const [currentPayout, setCurrentPayout] = useState<string>('0');
	const [isPlayingRound, setIsPlayingRound] = useState(false);
	const [isCashingOut, setIsCashingOut] = useState(false);

	// Keep ref in sync with state
	useEffect(() => {
		selectionsRef.current = selections;
	}, [selections]);

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
		selectionsRef.current = new Array(STAGES.length).fill(null);
		setCards(createInitialCards());
		setResults(new Array(STAGES.length).fill(null));
		setCurrentPayout(betValue);

		try {
			const wagerAmount = parseFloat(betValue);
			const maxPotentialPayout = wagerAmount * 1.9 * 1.9 * 2.0 * 4.0; // Calculate max potential

			console.log('Wager amount:', betValue, 'XPL');
			console.log(
				'Max potential payout:',
				maxPotentialPayout.toFixed(4),
				'XPL'
			);

			const newGameId = await contractService.startGame(betValue);
			setGameId(newGameId);

			// Set up event listeners for this game
			contractService.listenToGameEvents(newGameId, {
				onRoundPlayed: (roundIndex, card, win, newPayout) => {
					console.log('Round played:', { roundIndex, card, win, newPayout });

					// Convert BigInt if needed
					const index =
						typeof roundIndex === 'bigint' ? Number(roundIndex) : roundIndex;

					// Update card
					const convertedCard = convertCardFromContract(card);
					setCards((prev) => {
						const updated = [...prev];
						updated[index] = {
							card: convertedCard,
							isFlipped: true,
						};
						return updated;
					});

					// Update result
					setResults((prev) => {
						const updated = [...prev];
						updated[index] = win;
						return updated;
					});

					// Update payout
					setCurrentPayout(newPayout);

					// Move to next round if won
					if (win && index < 3) {
						setActiveCardIndex(index + 1);
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
	const playRound = useCallback(
		async (selection: string) => {
			console.log('playRound called', { gameId, activeCardIndex, selection });

			if (!gameId || !isConnected) {
				setError('No active game');
				return;
			}

			if (!selection) {
				setError('Please make a selection first');
				return;
			}

			console.log('Playing round:', { selection, activeCardIndex });
			setIsPlayingRound(true);
			setError(null);

			try {
				const roundType = activeCardIndex as RoundType;
				const choice = convertSelectionToContract(activeCardIndex, selection);

				console.log('Calling contract playRound:', {
					gameId,
					roundType,
					choice,
				});
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
		},
		[gameId, isConnected, activeCardIndex]
	);

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
			// Cash out successful, reset everything
			setGameId(null);
			setCurrentPayout('0');
			// Reset game state
			setActiveCardIndex(0);
			setSelections(new Array(STAGES.length).fill(null));
			selectionsRef.current = new Array(STAGES.length).fill(null);
			setBetValue('');
			setCards(createInitialCards());
			setResults(new Array(STAGES.length).fill(null));
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
		async (index: number) => {
			console.log('flipCard called', {
				index,
				activeCardIndex,
				selections: selectionsRef.current,
				gameId,
			});

			if (index !== activeCardIndex) {
				console.log('Not active card index');
				return;
			}

			// Use ref to get current selections
			const selection = selectionsRef.current[index];
			if (!selection) {
				console.log('No selection made');
				setError('Please make a selection first (Red or Black, etc.)');
				return;
			}

			// If no game started yet and user clicks first card with selection, auto-start
			if (!gameId && index === 0 && isConnected) {
				console.log('Auto-starting game...');
				const bet = betValue || '0.01';
				setBetValue(bet);

				setLoading(true);
				setError(null);
				setActiveCardIndex(0);
				setSelections([selection, null, null, null]);
				selectionsRef.current = [selection, null, null, null];
				setCards(createInitialCards());
				setResults(new Array(STAGES.length).fill(null));
				setCurrentPayout(bet);

				try {
					const wagerAmount = parseFloat(bet);
					const maxPotentialPayout = wagerAmount * 1.9 * 1.9 * 2.0 * 4.0;

					console.log('Wager amount:', bet, 'XPL');
					console.log('Max potential payout:', maxPotentialPayout.toFixed(4), 'XPL');

					const newGameId = await contractService.startGame(bet);
					setGameId(newGameId);

					// Set up event listeners
					contractService.listenToGameEvents(newGameId, {
						onRoundPlayed: (roundIndex, card, win, newPayout) => {
							console.log('Round played:', { roundIndex, card, win, newPayout });

							const idx = typeof roundIndex === 'bigint' ? Number(roundIndex) : roundIndex;
							const convertedCard = convertCardFromContract(card);

							setCards((prev) => {
								const updated = [...prev];
								updated[idx] = {
									card: convertedCard,
									isFlipped: true,
								};
								return updated;
							});

							setResults((prev) => {
								const updated = [...prev];
								updated[idx] = win;
								return updated;
							});

							setCurrentPayout(newPayout);

							if (win && idx < 3) {
								setActiveCardIndex(idx + 1);
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

					// Now play the first round
					console.log('Playing first round with selection:', selection);
					setIsPlayingRound(true);
					const roundType = 0 as RoundType;
					const choice = convertSelectionToContract(0, selection);
					const win = await contractService.playRound(newGameId, roundType, choice);

					if (!win) {
						setGameId(null);
					}
				} catch (err) {
					const errorMessage = err instanceof Error ? err.message : 'Failed to start game';
					setError(errorMessage);
					console.error('Error in auto-start:', err);
				} finally {
					setLoading(false);
					setIsPlayingRound(false);
				}
				return;
			}

			console.log('Calling playRound with selection:', selection);
			// Play the round on blockchain
			playRound(selection);
		},
		[activeCardIndex, playRound, gameId, isConnected, betValue]
	);

	const makeSelection = useCallback(
		(value: string) => {
			console.log('makeSelection called:', {
				value,
				activeCardIndex,
				selectionsLength: selections.length,
			});
			if (activeCardIndex >= selections.length) {
				console.log('activeCardIndex out of bounds');
				return;
			}
			setSelections((prev) => {
				const updated = [...prev];
				updated[activeCardIndex] = value;
				console.log('Updated selections:', updated);
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

	const hasGameStarted = useMemo(() => gameId !== null, [gameId]);

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
