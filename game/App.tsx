import React, { useMemo, useState, useEffect } from 'react';
import {
	StyleSheet,
	View,
	Text,
	StatusBar,
	Dimensions,
	ActivityIndicator,
	Pressable,
	TextInput,
} from 'react-native';
import { contractService } from './src/services/contractService';

import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import PlayingCard from './components/PlayingCard';
import { useWeb3GameLogic } from './hooks/useWeb3GameLogic';
import { MetaMaskProvider, useMetaMask } from './src/contexts/MetaMaskContext';
import { config } from './src/config';
import { useSounds, SoundType } from './hooks/useSounds';
import { SoundProvider } from 'react-sounds';
import { AnimatedStatusMessage } from './components/AnimatedStatusMessage';
import { AnimatedPayout } from './components/AnimatedPayout';

const AppContent: React.FC = () => {
	const {
		account,
		balance,
		isConnected,
		isConnecting,
		connectWallet,
		disconnectWallet,
	} = useMetaMask();
	const {
		cards,
		loading,
		error,
		startGame,
		flipCard,
		activeCardIndex,
		currentStage,
		selections,
		makeSelection,
		isRoundComplete,
		betValue,
		setBetValue,
		gameWon,
		gameLost,
		hasGameStarted,
		currentPayout,
		cashOut,
		isCashingOut,
		isPlayingRound,
		gameId,
		results,
	} = useWeb3GameLogic();
	const [houseLiquidity, setHouseLiquidity] = useState<string | null>(null);
	const [maxPayout, setMaxPayout] = useState<string | null>(null);
	const [isLoadingContractInfo, setIsLoadingContractInfo] = useState(false);
	const { playSound } = useSounds();

	const currentSelection = useMemo(() => {
		const selection =
			activeCardIndex < selections.length ? selections[activeCardIndex] : null;
		return selection;
	}, [activeCardIndex, selections]);
	const betEditable = !hasGameStarted && !loading && isConnected;

	// Play sounds on game events
	useEffect(() => {
		if (gameWon) {
			playSound(SoundType.WinRound);
		}
	}, [gameWon]);

	useEffect(() => {
		if (gameLost) {
			playSound(SoundType.Lose);
		}
	}, [gameLost]);

	useEffect(() => {
		const completedRounds = results.filter((r) => r !== null).length;
		if (completedRounds > 0 && results[completedRounds - 1] === true && !gameWon) {
			playSound(SoundType.WinRound);
		}
	}, [results, gameWon]);

	// Fetch house liquidity and max payout when connected
	useEffect(() => {
		if (!isConnected) {
			// Reset when disconnected
			setHouseLiquidity(null);
			setMaxPayout(null);
			setIsLoadingContractInfo(false);
			return;
		}

		const fetchContractInfo = async () => {
			// Always set loading to true when starting fetch
			setIsLoadingContractInfo(true);
			try {
				const liquidity = await contractService.getHouseLiquidity();
				const maxPay = await contractService.getMaxPayout();
				setHouseLiquidity(liquidity);
				setMaxPayout(maxPay);
			} catch (err) {
				// Set default values on error
				setHouseLiquidity('0');
				setMaxPayout('0');
			} finally {
				setIsLoadingContractInfo(false);
			}
		};

		// Initial fetch
		fetchContractInfo();

		// Refresh every 10 seconds
		const interval = setInterval(fetchContractInfo, 30000);
		return () => clearInterval(interval);
	}, [isConnected]);

	const getStatusMessage = () => {
		if (gameWon) {
			return `🎉 You won all 4 rounds!`;
		}
		if (gameLost) {
			const lastRoundResult = results.findIndex((r) => r === false);
			return `💔 You lost on round ${lastRoundResult + 1}! Better luck next time`;
		}
		if (isRoundComplete) {
			return 'Game complete!';
		}
		if (hasGameStarted) {
			const wonRounds = results.filter((r) => r === true).length;
			const playedRounds = results.filter((r) => r !== null).length;
			if (playedRounds > 0) {
				const lastResult = results[playedRounds - 1];
				if (lastResult === true) {
					return `✅ Round ${playedRounds} won!`;
				} else if (lastResult === false) {
					return `❌ Round ${playedRounds} lost! Game over`;
				}
			}
			return '';
		}
		return '';
	};

	return (
		<View style={styles.container}>
			<StatusBar backgroundColor="#1a1a2e" barStyle="light-content" />

			{/* Main Content */}
			<View style={styles.mainContent}>
				{/* Area 1: Title and Bet Input */}
				<View style={styles.topSection}>
					<Header />

					<View style={styles.betContainer}>
						<Text style={styles.betLabel}>
							{hasGameStarted && results.some((r) => r === true)
								? 'Current Payout (XPL):'
								: 'Bet Amount (XPL):'}
						</Text>
						{hasGameStarted && results.some((r) => r === true) ? (
							<AnimatedPayout currentPayout={currentPayout} />
						) : (
							<TextInput
								style={[
									styles.betInput,
									!betEditable && styles.betInputDisabled,
								]}
								value={betValue}
								onChangeText={setBetValue}
								placeholder={config.DEFAULT_WAGER}
								placeholderTextColor="#999"
								keyboardType="decimal-pad"
								editable={betEditable}
							/>
						)}
					</View>
				</View>

				{/* Area 2: Cards */}
				<View style={styles.middleSection}>
					{/* Status/Error Container - Always takes same space */}
					<AnimatedStatusMessage
						error={error}
						gameLost={gameLost}
						gameWon={gameWon}
						statusMessage={getStatusMessage()}
					/>

					<View style={styles.cardsContainer}>
						{loading && (
							<View style={styles.loadingContainer}>
								<ActivityIndicator size="large" color="#ffffff" />
								<Text style={styles.loadingText}>
									{gameId ? 'Playing round...' : 'Starting game...'}
								</Text>
							</View>
						)}
						{!loading && cards.length > 0 && (
							<View style={styles.cardsRow}>
								{cards.map((card, index) => (
									<View key={index} style={styles.cardWrapper}>
										<PlayingCard
											cardState={card}
											onCardPressed={() => flipCard(index)}
											width={120}
											disabled={index !== activeCardIndex || isPlayingRound}
										/>
									</View>
								))}
							</View>
						)}
					</View>
				</View>

				{/* Area 3: User Choice and Checkout */}
				<View style={styles.bottomSection}>
					{currentStage &&
						!isRoundComplete &&
						isConnected &&
						!gameWon &&
						!gameLost && (
							<View style={styles.stageContainer}>
								<Text style={styles.stageTitle}>{currentStage.title}</Text>
								<View style={styles.optionsContainer}>
									{currentStage.options.map((option) => (
										<Pressable
											key={option.value}
											style={[
												styles.optionButton,
												currentSelection === option.value &&
												styles.optionButtonActive,
											]}
											onPress={() => {
												playSound(SoundType.SelectionButton);
												makeSelection(option.value);
											}}
											disabled={isPlayingRound}
										>
											<Text
												style={[
													styles.optionText,
													currentSelection === option.value &&
													styles.optionTextActive,
												]}
											>
												{option.label}
											</Text>
										</Pressable>
									))}
								</View>
							</View>
						)}

					{/* Cash Out Section */}
					{hasGameStarted && results.some((r) => r === true) && !gameLost && (
						<View style={styles.cashOutSection}>
							<Pressable
								style={[
									styles.cashOutButton,
									isCashingOut && styles.cashOutButtonDisabled,
								]}
								onPress={() => {
									playSound(SoundType.CashOut);
									cashOut();
								}}
								disabled={isCashingOut}
							>
								<Text style={styles.cashOutButtonText}>
									{isCashingOut ? 'Cashing out...' : 'Cash Out'}
								</Text>
							</Pressable>
						</View>
					)}

					{/* New Game Button - Only show when lost */}
					{gameLost && isConnected && (
						<View style={styles.newGameSection}>
							<Pressable
								style={[styles.actionButton, styles.newGameButton]}
								onPress={() => window.location.reload()}
								disabled={loading}
							>
								<Text style={styles.actionButtonText}>New Game</Text>
							</Pressable>
						</View>
					)}
				</View>
			</View>

			{/* Right Sidebar */}
			<View style={styles.rightSidebar}>
				{/* MetaMask Connection Status */}
				<View style={styles.walletSection}>
					{!isConnected ? (
						<Pressable
							style={[
								styles.connectButton,
								isConnecting && styles.connectButtonDisabled,
							]}
							onPress={connectWallet}
							disabled={isConnecting}
						>
							<Text style={styles.connectButtonText}>
								{isConnecting ? 'Connecting...' : 'Connect MetaMask'}
							</Text>
						</Pressable>
					) : (
						<View style={styles.walletInfo}>
							<Text style={styles.walletAddress}>
								{account?.slice(0, 6)}...{account?.slice(-4)}
							</Text>
							<Text style={styles.walletBalance}>{balance} XPL</Text>
							<Pressable
								style={styles.disconnectButton}
								onPress={disconnectWallet}
							>
								<Text style={styles.disconnectButtonText}>Disconnect</Text>
							</Pressable>
						</View>
					)}
				</View>

				{/* Contract Info */}
				{isConnected && (
					<View style={styles.contractInfoSection}>
						<Text style={styles.sectionTitle}>Contract Info</Text>
						<View style={styles.contractInfo}>
							{isLoadingContractInfo || houseLiquidity == null ? (
								<View style={styles.contractLoadingContainer}>
									<ActivityIndicator size="small" color="#f39c12" />
									<Text style={styles.contractLoadingText}>Fetching...</Text>
								</View>
							) : (
								<>
									<Text style={styles.contractInfoText}>
										House: {houseLiquidity ?? '0'} XPL
									</Text>
									<Text style={styles.contractInfoText}>
										Max: {maxPayout ?? '0'} XPL
									</Text>
								</>
							)}
						</View>
					</View>
				)}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#1a1a2e',
		flexDirection: 'row',
	},
	mainContent: {
		flex: 1,
		flexDirection: 'column',
	},
	topSection: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		borderBottomWidth: 1,
		borderBottomColor: '#3d3d6b',
		paddingVertical: 20,
	},
	middleSection: {
		flex: 2,
		justifyContent: 'center',
		alignItems: 'center',
		borderBottomWidth: 1,
		borderBottomColor: '#3d3d6b',
		paddingVertical: 20,
	},
	bottomSection: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingVertical: 20,
	},
	rightSidebar: {
		width: 200,
		backgroundColor: '#232343',
		borderLeftWidth: 1,
		borderLeftColor: '#3d3d6b',
		padding: 10,
	},
	walletSection: {
		marginBottom: 20,
	},
	connectButton: {
		backgroundColor: '#f39c12',
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 5,
	},
	connectButtonText: {
		color: '#fff',
		fontWeight: 'bold',
	},
	connectButtonDisabled: {
		opacity: 0.6,
	},
	walletInfo: {
		backgroundColor: '#2c2c54',
		padding: 10,
		borderRadius: 5,
	},
	walletAddress: {
		color: '#fff',
		fontSize: 12,
		marginBottom: 5,
	},
	walletBalance: {
		color: '#f39c12',
		fontSize: 14,
		fontWeight: 'bold',
		marginBottom: 5,
	},
	disconnectButton: {
		backgroundColor: '#e74c3c',
		paddingHorizontal: 10,
		paddingVertical: 5,
		borderRadius: 3,
	},
	disconnectButtonText: {
		color: '#fff',
		fontSize: 12,
	},
	cashOutSection: {
		marginTop: 20,
		alignItems: 'center',
	},
	cashOutButton: {
		backgroundColor: '#f39c12',
		paddingHorizontal: 30,
		paddingVertical: 15,
		borderRadius: 5,
	},
	cashOutButtonDisabled: {
		backgroundColor: '#555',
		opacity: 0.5,
	},
	cashOutButtonText: {
		color: '#fff',
		fontSize: 13,
		fontWeight: 'bold',
		textAlign: 'center',
	},
	betContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 20,
		marginBottom: 10,
		minHeight: 40,
	},
	betLabel: {
		color: '#fff',
		fontSize: 16,
		marginRight: 10,
	},
	betInput: {
		backgroundColor: '#2c2c54',
		color: '#fff',
		paddingHorizontal: 15,
		paddingVertical: 8,
		borderRadius: 5,
		minWidth: 100,
		fontSize: 16,
	},
	betInputDisabled: {
		opacity: 0.5,
	},
	hintText: {
		color: '#95a5a6',
		fontSize: 12,
		textAlign: 'center',
		marginTop: 5,
		fontStyle: 'italic',
	},
	cardsContainer: {
		justifyContent: 'center',
		alignItems: 'center',
	},
	cardsRow: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
	},
	cardWrapper: {
		marginHorizontal: 15,
		alignItems: 'center',
	},
	clickToFlip: {
		color: '#f39c12',
		fontSize: 12,
		fontWeight: 'bold',
		marginTop: 5,
	},
	loadingContainer: {
		justifyContent: 'center',
		alignItems: 'center',
	},
	loadingText: {
		color: '#fff',
		marginTop: 10,
	},
	stageContainer: {
		alignItems: 'center',
		marginBottom: 15,
	},
	stageTitle: {
		color: '#fff',
		fontSize: 18,
		marginBottom: 15,
		fontWeight: 'bold',
	},
	optionsContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		gap: 10,
	},
	optionButton: {
		backgroundColor: '#2c2c54',
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 5,
		marginHorizontal: 5,
		borderWidth: 2,
		borderColor: 'transparent',
	},
	optionButtonActive: {
		borderColor: '#f39c12',
		backgroundColor: '#3d3d6b',
	},
	optionText: {
		color: '#fff',
		fontSize: 14,
		fontWeight: 'bold',
	},
	optionTextActive: {
		color: '#f39c12',
	},
	newGameSection: {
		marginTop: 20,
		alignItems: 'center',
	},
	actionButton: {
		paddingHorizontal: 30,
		paddingVertical: 15,
		borderRadius: 5,
		marginBottom: 10,
	},
	startButton: {
		backgroundColor: '#27ae60',
	},
	newGameButton: {
		backgroundColor: '#3498db',
	},
	actionButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: 'bold',
	},
	contractInfoSection: {
		marginTop: 10,
	},
	sectionTitle: {
		color: '#fff',
		fontSize: 14,
		fontWeight: 'bold',
		marginBottom: 8,
	},
	contractInfo: {
		backgroundColor: '#2c2c54',
		padding: 10,
		borderRadius: 5,
	},
	contractInfoText: {
		color: '#fff',
		fontSize: 12,
		marginBottom: 3,
	},
	warningText: {
		color: '#f39c12',
		fontSize: 11,
		fontWeight: 'bold',
		marginTop: 5,
	},
	contractLoadingContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 5,
	},
	contractLoadingText: {
		color: '#f39c12',
		fontSize: 12,
		marginLeft: 8,
	},
});

const App: React.FC = () => {
	return (
		<ErrorBoundary>
			<SoundProvider>
				<MetaMaskProvider>
					<AppContent />
				</MetaMaskProvider>
			</SoundProvider>
		</ErrorBoundary>
	);
};

export default App;
