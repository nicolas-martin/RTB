import React, { memo } from 'react';
import {
	View,
	Image,
	TouchableWithoutFeedback,
	StyleSheet,
} from 'react-native';
import { CardState } from '../types';
import { config } from '../config';

interface PlayingCardProps {
	cardState: CardState;
	onCardPressed: () => void;
	width: number;
}

const PlayingCard: React.FC<PlayingCardProps> = memo(
	({ cardState, onCardPressed, width }) => {
		const { isFlipped, image } = cardState;
		const height = width * config.CARD_ASPECT_RATIO;
		const marginPadding = width * 0.2;

		const imageUrl = isFlipped ? image : config.CARD_BACK_URL;

		return (
			<View style={styles.container}>
				<TouchableWithoutFeedback onPress={onCardPressed}>
					<Image
						style={[
							styles.image,
							{
								width,
								height,
								marginHorizontal: marginPadding / 2,
							},
						]}
						source={{ uri: imageUrl }}
						resizeMode="contain"
					/>
				</TouchableWithoutFeedback>
			</View>
		);
	},
	(prevProps, nextProps) => {
		// Custom comparison for memo optimization
		return (
			prevProps.cardState.isFlipped === nextProps.cardState.isFlipped &&
			prevProps.cardState.image === nextProps.cardState.image &&
			prevProps.width === nextProps.width
		);
	}
);

PlayingCard.displayName = 'PlayingCard';

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
	},
	image: {
		borderRadius: 8,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
	},
});

export default PlayingCard;
