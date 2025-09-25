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
	} = useWeb3GameLogic();
	const [houseLiquidity, setHouseLiquidity] = useState<string>('0');
	const [maxPayout, setMaxPayout] = useState<string>('0');

	const windowWidth = Dimensions.get('window').width;
	const currentSelection = useMemo(() => {
		const selection = activeCardIndex < selections.length ? selections[activeCardIndex] : null;
		console.log('currentSelection computed:', { activeCardIndex, selection, selections });
		return selection;
	}, [activeCardIndex, selections]);
	const betEditable = !hasGameStarted && !loading && isConnected;

	// Fetch house liquidity and max payout when connected
	useEffect(() => {
		const fetchContractInfo = async () => {
			if (isConnected) {
				try {
					const liquidity = await contractService.getHouseLiquidity();
					const maxPay = await contractService.getMaxPayout();
					setHouseLiquidity(liquidity);
					setMaxPayout(maxPay);
				} catch (err) {
					console.error('Error fetching contract info:', err);
				}
			}
		};
		fetchContractInfo();
		// Refresh every 10 seconds
		const interval = setInterval(fetchContractInfo, 10000);
		return () => clearInterval(interval);
	}, [isConnected]);

	const getStatusMessage = () => {
		if (!isConnected) {
			return 'Connect wallet to play';
		}
		if (gameWon) {
			return `🎉 You won! Payout: ${currentPayout} XPL`;
		}
		if (gameLost) {
			return '💔 You lost! Better luck next time';
		}
		if (isRoundComplete) {
			return 'Round complete!';
		}
		if (hasGameStarted) {
			return `Current payout: ${currentPayout} XPL`;
		}
		return 'Ready to play';
	};

	return (
		<View style={styles.container}>
			<StatusBar backgroundColor="#1a1a2e" barStyle="light-content" />

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
							<Text style={styles.contractInfoText}>
								House: {houseLiquidity} XPL
							</Text>
							<Text style={styles.contractInfoText}>Max: {maxPayout} XPL</Text>
							{parseFloat(houseLiquidity) === 0 && (
								<Text style={styles.warningText}>⚠️ Needs funding</Text>
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
				{error && (
					<View style={styles.errorContainer}>
						<Text style={styles.errorTitle}>Transaction Error:</Text>
						<Text style={styles.errorText}>{error}</Text>
					</View>
				)}
			</View>

			{/* Cards Container */}
			<View style={styles.cardsWrapper}>
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
									{index === activeCardIndex &&
										currentSelection &&
										!isPlayingRound &&
										hasGameStarted && (
											<Text style={styles.clickToFlip}>Click to flip!</Text>
										)}
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
				{!hasGameStarted && isConnected && (
					<Pressable
						style={[styles.actionButton, styles.startButton]}
						onPress={startGame}
						disabled={loading || !betValue}
					>
						<Text style={styles.actionButtonText}>Start Game</Text>
					</Pressable>
				)}

				{gameWon && (
					<Pressable
						style={[styles.actionButton, styles.cashOutButton]}
						onPress={cashOut}
						disabled={isCashingOut}
					>
						<Text style={styles.actionButtonText}>
							{isCashingOut
								? 'Cashing out...'
								: `Cash out ${currentPayout} XPL`}
						</Text>
					</Pressable>
				)}

				{gameLost && (
					<Pressable
						style={[styles.actionButton, styles.newGameButton]}
						onPress={() => window.location.reload()}
					>
						<Text style={styles.actionButtonText}>New Game</Text>
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
		marginTop: 10,
		backgroundColor: 'rgba(231, 76, 60, 0.1)',
		borderWidth: 1,
		borderColor: '#e74c3c',
		borderRadius: 5,
		padding: 10,
		maxWidth: '90%',
		alignSelf: 'center',
	},
	errorTitle: {
		color: '#e74c3c',
		fontSize: 14,
		fontWeight: 'bold',
		marginBottom: 5,
	},
	errorText: {
		color: '#e74c3c',
		fontSize: 11,
		fontFamily: 'monospace',
		flexWrap: 'wrap',
		wordBreak: 'break-word',
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
