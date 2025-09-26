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

	const windowWidth = Dimensions.get('window').width;
	const currentSelection = useMemo(() => {
		const selection =
			activeCardIndex < selections.length ? selections[activeCardIndex] : null;
		console.log('currentSelection computed:', {
			activeCardIndex,
			selection,
			selections,
		});
		return selection;
	}, [activeCardIndex, selections]);
	const betEditable = !hasGameStarted && !loading && isConnected;

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
				console.error('Error fetching contract info:', err);
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
		if (!isConnected) {
			return 'Connect wallet to play';
		}
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
			// Show round results
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
			return 'Game in progress';
		}
		return 'Ready to play';
	};

	return (
		<View style={styles.container}>
			<StatusBar backgroundColor="#1a1a2e" barStyle="light-content" />

			{/* Right Sidebar */}
			<View style={styles.rightSidebar}>
				{/* Cash Out Button - Always visible at top */}
				<Pressable
					style={[
						styles.cashOutButtonTop,
						(!hasGameStarted ||
							!results.some((r) => r === true) ||
							isCashingOut ||
							gameLost) &&
							styles.cashOutButtonDisabled,
					]}
					onPress={cashOut}
					disabled={
						!hasGameStarted ||
						!results.some((r) => r === true) ||
						isCashingOut ||
						gameLost
					}
				>
					<Text style={styles.cashOutButtonText}>
						{isCashingOut ? 'Cashing out...' : `Cash Out: ${currentPayout} XPL`}
					</Text>
				</Pressable>

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

			<Header />

			{/* Bet Input */}
			<View style={styles.betContainer}>
				<Text style={styles.betLabel}>Bet Amount (XPL):</Text>
				<TextInput
					style={[styles.betInput, !betEditable && styles.betInputDisabled]}
					value={betValue}
					onChangeText={setBetValue}
					placeholder="0.01"
					placeholderTextColor="#999"
					keyboardType="decimal-pad"
					editable={betEditable}
				/>
			</View>

			{/* Game Status */}
			<View style={styles.statusContainer}>
				<Text style={styles.statusText}>{getStatusMessage()}</Text>
			</View>

			{/* Cards Container */}
			<View style={styles.cardsWrapper}>
				{/* Error message above cards */}
				{error && (
					<View style={styles.errorContainer}>
						<Text style={styles.errorTitle}>Error:</Text>
						<Text style={styles.errorText}>{error}</Text>
					</View>
				)}
				<View style={[styles.cardsContainer, { width: windowWidth }]}>
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

			{/* Stage Selection */}
			{currentStage && !isRoundComplete && isConnected && hasGameStarted && (
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
									console.log('Button pressed:', option.value);
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

			{/* Game Actions */}
			<View style={styles.gameActions}>
				{(!hasGameStarted || gameLost || gameWon) && isConnected && (
					<Pressable
						style={[styles.actionButton, styles.startButton]}
						onPress={() => {
							if (gameLost || gameWon) {
								window.location.reload();
							} else {
								startGame();
							}
						}}
						disabled={loading || (!betValue && !gameLost && !gameWon)}
					>
						<Text style={styles.actionButtonText}>
							{gameLost || gameWon ? 'New Game' : 'Start Game'}
						</Text>
					</Pressable>
				)}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#1a1a2e',
		alignItems: 'center',
		paddingVertical: 20,
		paddingRight: 210, // Account for sidebar
	},
	rightSidebar: {
		position: 'absolute',
		top: 0,
		right: 0,
		bottom: 0,
		width: 200,
		backgroundColor: '#232343',
		borderLeftWidth: 1,
		borderLeftColor: '#3d3d6b',
		padding: 10,
		zIndex: 1000,
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
	cashOutButtonTop: {
		backgroundColor: '#f39c12',
		paddingHorizontal: 15,
		paddingVertical: 10,
		borderRadius: 5,
		marginBottom: 15,
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
	statusContainer: {
		marginBottom: 20,
		minHeight: 30,
	},
	statusText: {
		color: '#fff',
		fontSize: 16,
		textAlign: 'center',
	},
	errorContainer: {
		backgroundColor: 'rgba(231, 76, 60, 0.15)',
		borderWidth: 1,
		borderColor: '#e74c3c',
		borderRadius: 5,
		padding: 10,
		marginBottom: 15,
		maxWidth: 600,
		alignSelf: 'center',
		width: '90%',
	},
	errorTitle: {
		color: '#e74c3c',
		fontSize: 14,
		fontWeight: 'bold',
		marginBottom: 5,
	},
	errorText: {
		color: '#e74c3c',
		fontSize: 12,
		fontFamily: 'monospace',
		flexWrap: 'wrap',
		wordBreak: 'break-word',
	},
	hintText: {
		color: '#95a5a6',
		fontSize: 12,
		textAlign: 'center',
		marginTop: 5,
		fontStyle: 'italic',
	},
	cardsWrapper: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		minHeight: 300,
	},
	cardsContainer: {
		height: 280,
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
		marginBottom: 20,
		alignItems: 'center',
		minHeight: 80,
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
	gameActions: {
		marginTop: 20,
		alignItems: 'center',
		minHeight: 60,
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
	cashOutButton: {
		backgroundColor: '#f39c12',
	},
	newGameButton: {
		backgroundColor: '#3498db',
	},
	actionButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: 'bold',
	},
	cashOutContainer: {
		alignItems: 'center',
		marginTop: 10,
	},
	cashOutInfo: {
		color: '#fff',
		fontSize: 14,
		marginBottom: 10,
		textAlign: 'center',
	},
	continueHint: {
		color: '#95a5a6',
		fontSize: 12,
		marginTop: 10,
		fontStyle: 'italic',
		textAlign: 'center',
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
			<MetaMaskProvider>
				<AppContent />
			</MetaMaskProvider>
		</ErrorBoundary>
	);
};

export default App;
