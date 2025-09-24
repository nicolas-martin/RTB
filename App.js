/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';

import Header from './components/Header';
import PlayingCard from './components/PlayingCard';
import helpers from './helpers';

class App extends React.Component {
	state = {
		card1: {isFlipped: false, image: ''},
		card2: {isFlipped: false, image: ''},
		card3: {isFlipped: false, image: ''},
		card4: {isFlipped: false, image: ''},
	}

	constructor(props) {
		super(props)

		Dimensions.addEventListener('change', () => {
			this.setState({
				orientation: this.isPortrait() ? 'portrait' : 'landscape'
			});
		});
	}

	isPortrait = () => {
		const dim = Dimensions.get('screen');
		return dim.height >= dim.width;
	};

	componentDidMount() {
		this.getCards()
	}

	getCards = () => {
		helpers.startGame()
			.then(response => {
				this.setState({
					card1: {isFlipped: false, image: response[0].image},
					card2: {isFlipped: false, image: response[1].image},
					card3: {isFlipped: false, image: response[2].image},
					card4: {isFlipped: false, image: response[3].image},
				})
			})
			.catch(error => {
				console.error(error)
			})
	}


	onCardPressed = (index) => {
		let whichCard = 'card' + (index) // index === 1 -> 'card1'

		let originalValue = this.state[whichCard] // this.state.card1 === this.state['card1']
		let newValue = {...originalValue, isFlipped: true}

		this.setState({[whichCard]: newValue})
	}

	render() {
		let { card1, card2, card3, card4 } = this.state
		
		const windowWidth = Dimensions.get('window').width;

		return (
			<>
			<StatusBar barStyle="dark-content" />
			<View style={styles.container}>
				<Header />
			
				<View style={styles.buttons}>
					<TouchableOpacity 
						onPress={this.getCards}
						style={styles.drawCardsButton}
					>
						<Text style={styles.buttonText}>
							Draw Cards
						</Text>
					</TouchableOpacity>
					<TouchableOpacity 
						onPress={helpers.rules}
						style={styles.rulesButton}
					>
						<Text style={styles.buttonText}>
							Rules
						</Text>
					</TouchableOpacity>
				</View>

				<View style={styles.cards}>
					<PlayingCard 
						cardState={card1} 
						onCardPressed={() => this.onCardPressed(1)}
						width={windowWidth / 5}
					/>
					<PlayingCard 
						cardState={card2} 
						onCardPressed={() => this.onCardPressed(2)} 
						width={windowWidth / 5}
					/>
					<PlayingCard 
						cardState={card3} 
						onCardPressed={() => this.onCardPressed(3)}
						width={windowWidth / 5}
					/>
					<PlayingCard 
						cardState={card4} 
						onCardPressed={() => this.onCardPressed(4)}
						width={windowWidth / 5}
					/>
				</View>
			</View>
			</>
		);
	};
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
		margin: 10
	},
	rulesButton: {
		backgroundColor: '#495057',
		padding: 8,
		margin: 10
	},
	buttonText: {
		color: 'white'
	},
	logo: {
		width: 66,
		height: 58,
	  },
});

export default App;
