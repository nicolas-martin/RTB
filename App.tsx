import React, { useEffect, useMemo } from 'react';
import {
	StyleSheet,
	View,
	Text,
	StatusBar,
	Dimensions,
	ActivityIndicator,
	Pressable,
} from 'react-native';

import Header from './components/Header';
import PlayingCard from './components/PlayingCard';
import { useGame } from './contexts/GameContext';
import { useOrientation } from './hooks/useOrientation';
import RulesModal from './components/RulesModal';

const App: React.FC = () => {
	const _orientation = useOrientation();
	const {
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
		selections,
		makeSelection,
		isRoundComplete,
	} = useGame();
	const windowWidth = Dimensions.get('window').width;
	const currentSelection = useMemo(
		() =>
			activeCardIndex < selections.length ? selections[activeCardIndex] : null,
		[activeCardIndex, selections]
	);

	useEffect(() => {
		drawCards();
	}, [drawCards]);

	return (
		<>
			<StatusBar barStyle="dark-content" />
			<View style={styles.container}>
				<Header />
				<View style={styles.stageContainer}>
					{isRoundComplete ? (
						<Text style={styles.stageCompleteText}>
							All cards revealed! Draw a new set to keep playing.
						</Text>
					) : currentStage ? (
						<>
							<Text style={styles.stageTitle}>{currentStage.title}</Text>
							<Text style={styles.stageDescription}>
								{currentStage.description}
							</Text>
							<View style={styles.optionRow}>
								{currentStage.options.map((option) => {
									const isSelected = currentSelection === option.value;
									return (
										<Pressable
											key={option.value}
											style={({ pressed }) => [
												styles.optionButton,
												isSelected && styles.optionButtonSelected,
												pressed && styles.optionButtonPressed,
											]}
											onPress={() => makeSelection(option.value)}
											accessibilityRole="button"
											accessibilityState={{ selected: isSelected }}
										>
											<Text
												style={[
													styles.optionButtonText,
													isSelected && styles.optionButtonTextSelected,
												]}
											>
												{option.label}
											</Text>
										</Pressable>
									);
								})}
							</View>
							<Text style={styles.stageHint}>
								Select an option, then reveal the highlighted card.
							</Text>
						</>
					) : null}
				</View>

				<View style={styles.buttons}>
					<Pressable
						onPress={drawCards}
						disabled={loading}
						style={({ pressed }) => [
							styles.button,
							styles.drawCardsButton,
							loading && styles.buttonDisabled,
							pressed && !loading && styles.buttonPressed,
						]}
					>
						<Text style={styles.buttonText}>
							{loading ? 'Loading...' : 'Draw Cards'}
						</Text>
					</Pressable>
					<Pressable
						onPress={showRules}
						style={({ pressed }) => [
							styles.button,
							styles.rulesButton,
							pressed && styles.buttonPressed,
						]}
					>
						<Text style={styles.buttonText}>Rules</Text>
					</Pressable>
				</View>

				{error && (
					<View style={styles.errorContainer}>
						<Text style={styles.errorText}>{error}</Text>
					</View>
				)}

				<View style={styles.cards}>
					{loading && cards.every((c) => !c.image) ? (
						<ActivityIndicator size="large" color="#5cb85c" />
					) : (
						cards.map((card, index) => {
							const selectionForCard =
								index < selections.length ? selections[index] : null;
							const isActive = index === activeCardIndex;
							const canFlip =
								isActive &&
								!card.isFlipped &&
								Boolean(selectionForCard) &&
								!loading;
							return (
								<PlayingCard
									key={`card-${index}`}
									cardState={card}
									onCardPressed={() => flipCard(index)}
									width={windowWidth / 5}
									isActive={isActive}
									disabled={!canFlip}
								/>
							);
						})
					)}
				</View>
			</View>
			<RulesModal visible={rulesVisible} onClose={hideRules} />
		</>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#22303f',
		paddingBottom: 24,
	},
	cards: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		paddingVertical: 12,
	},
	buttons: {
		flexDirection: 'row',
		width: '100%',
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: 16,
	},
	button: {
		paddingVertical: 10,
		paddingHorizontal: 18,
		marginHorizontal: 10,
		borderRadius: 6,
		alignItems: 'center',
		justifyContent: 'center',
	},
	drawCardsButton: {
		backgroundColor: '#5cb85c',
	},
	rulesButton: {
		backgroundColor: '#495057',
	},
	buttonPressed: {
		opacity: 0.85,
	},
	buttonDisabled: {
		opacity: 0.6,
	},
	buttonText: {
		color: 'white',
		fontSize: 16,
		fontWeight: '600',
	},
	stageContainer: {
		paddingHorizontal: 24,
		paddingBottom: 12,
	},
	stageTitle: {
		color: '#ffffff',
		fontSize: 20,
		fontWeight: '700',
		textAlign: 'center',
		marginBottom: 6,
	},
	stageDescription: {
		color: 'rgba(255, 255, 255, 0.85)',
		fontSize: 15,
		textAlign: 'center',
		marginBottom: 12,
	},
	optionRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'center',
		marginHorizontal: -6,
	},
	optionButton: {
		paddingVertical: 8,
		paddingHorizontal: 16,
		borderRadius: 999,
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.3)',
		backgroundColor: 'rgba(255, 255, 255, 0.08)',
		marginHorizontal: 6,
		marginBottom: 8,
	},
	optionButtonSelected: {
		backgroundColor: '#5cb85c',
		borderColor: '#5cb85c',
	},
	optionButtonPressed: {
		opacity: 0.85,
	},
	optionButtonText: {
		color: 'white',
		fontSize: 14,
		fontWeight: '600',
	},
	optionButtonTextSelected: {
		color: '#ffffff',
	},
	stageHint: {
		color: 'rgba(255, 255, 255, 0.7)',
		fontSize: 13,
		textAlign: 'center',
		marginTop: 10,
	},
	stageCompleteText: {
		color: '#ffffff',
		fontSize: 16,
		textAlign: 'center',
	},
	errorContainer: {
		padding: 10,
		margin: 10,
		backgroundColor: '#dc3545',
		borderRadius: 5,
	},
	errorText: {
		color: 'white',
		textAlign: 'center',
	},
});

export default App;
