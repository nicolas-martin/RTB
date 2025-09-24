import React, { useEffect } from 'react';
import {
	StyleSheet,
	View,
	Text,
	TouchableOpacity,
	StatusBar,
	Dimensions,
	ActivityIndicator,
} from 'react-native';

import Header from './components/Header';
import PlayingCard from './components/PlayingCard';
import { useGame } from './contexts/GameContext';
import { useOrientation } from './hooks/useOrientation';

const App: React.FC = () => {
	const _orientation = useOrientation();
	const { cards, loading, error, drawCards, flipCard, showRules } = useGame();
	const windowWidth = Dimensions.get('window').width;

	useEffect(() => {
		drawCards();
	}, [drawCards]);

	return (
		<>
			<StatusBar barStyle="dark-content" />
			<View style={styles.container}>
				<Header />

				<View style={styles.buttons}>
					<TouchableOpacity
						onPress={drawCards}
						style={styles.drawCardsButton}
						disabled={loading}
					>
						<Text style={styles.buttonText}>
							{loading ? 'Loading...' : 'Draw Cards'}
						</Text>
					</TouchableOpacity>
					<TouchableOpacity onPress={showRules} style={styles.rulesButton}>
						<Text style={styles.buttonText}>Rules</Text>
					</TouchableOpacity>
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
						cards.map((card, index) => (
							<PlayingCard
								key={`card-${index}`}
								cardState={card}
								onCardPressed={() => flipCard(index)}
								width={windowWidth / 5}
							/>
						))
					)}
				</View>
			</View>
		</>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#22303f',
	},
	cards: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
	},
	buttons: {
		flexDirection: 'row',
		width: '100%',
		height: '25%',
		justifyContent: 'center',
		alignItems: 'center',
	},
	drawCardsButton: {
		backgroundColor: '#5cb85c',
		padding: 8,
		margin: 10,
		borderRadius: 5,
	},
	rulesButton: {
		backgroundColor: '#495057',
		padding: 8,
		margin: 10,
		borderRadius: 5,
	},
	buttonText: {
		color: 'white',
		fontSize: 16,
		fontWeight: '600',
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
