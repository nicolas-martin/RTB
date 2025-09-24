import React, { useMemo } from 'react';
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

import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import PlayingCard from './components/PlayingCard';
import RulesModal from './components/RulesModal';
import { useWeb3GameLogic } from './hooks/useWeb3GameLogic';
import { useOrientation } from './hooks/useOrientation';
import { MetaMaskProvider, useMetaMask } from './src/contexts/MetaMaskContext';

const AppContent: React.FC = () => {
	const _orientation = useOrientation();
	const { account, balance, isConnected, connectWallet, disconnectWallet } =
		useMetaMask();
	const {
		cards,
		loading,
		error,
		startGame,
		flipCard,
		showRules,
		hideRules,
		rulesVisible,
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

	const windowWidth = Dimensions.get('window').width;
	const currentSelection = useMemo(
		() =>
			activeCardIndex < selections.length ? selections[activeCardIndex] : null,
		[activeCardIndex, selections]
	);
	const betEditable = !hasGameStarted && !loading && isConnected;

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

			{/* MetaMask Connection Status */}
			<View style={styles.walletContainer}>
				{!isConnected ? (
					<Pressable style={styles.connectButton} onPress={connectWallet}>
						<Text style={styles.connectButtonText}>Connect MetaMask</Text>
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

			<Header />

			{/* Bet Input */}
			<View style={styles.betContainer}>
				<Text style={styles.betLabel}>Bet Amount (XPL):</Text>
				<TextInput
					style={[styles.betInput, !betEditable && styles.betInputDisabled]}
					value={betValue}
					onChangeText={setBetValue}
					placeholder="0.1"
					placeholderTextColor="#999"
					keyboardType="decimal-pad"
					editable={betEditable}
				/>
			</View>

			{/* Game Status */}
			<View style={styles.statusContainer}>
				<Text style={styles.statusText}>{getStatusMessage()}</Text>
				{error && <Text style={styles.errorText}>{error}</Text>}
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
										width={80}
										disabled={index !== activeCardIndex || isPlayingRound}
									/>
								</View>
							))}
						</View>
					)}
				</View>
			</View>

			{/* Stage Selection */}
			{currentStage && !isRoundComplete && isConnected && (
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
								onPress={() => makeSelection(option.value)}
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

				<Pressable style={styles.rulesButton} onPress={showRules}>
					<Text style={styles.rulesButtonText}>Show Rules</Text>
				</Pressable>
			</View>

			<RulesModal visible={rulesVisible} onClose={hideRules} />
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#1a1a2e',
		alignItems: 'center',
		paddingVertical: 20,
	},
	walletContainer: {
		position: 'absolute',
		top: 10,
		right: 10,
		zIndex: 1000,
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
	walletInfo: {
		backgroundColor: '#2c2c54',
		padding: 10,
		borderRadius: 5,
		alignItems: 'flex-end',
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
	},
	statusText: {
		color: '#fff',
		fontSize: 16,
		textAlign: 'center',
	},
	errorText: {
		color: '#e74c3c',
		fontSize: 14,
		marginTop: 5,
		textAlign: 'center',
	},
	cardsWrapper: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	cardsContainer: {
		height: 200,
		justifyContent: 'center',
		alignItems: 'center',
	},
	cardsRow: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
	},
	cardWrapper: {
		marginHorizontal: 10,
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
	rulesButton: {
		backgroundColor: '#8e44ad',
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 5,
		marginTop: 10,
	},
	rulesButtonText: {
		color: '#fff',
		fontSize: 14,
		fontWeight: 'bold',
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
