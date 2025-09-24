import React, { memo } from 'react';
import { Image, Pressable, StyleSheet, Platform, ViewStyle } from 'react-native';
import { CardState } from '../types';
import { config } from '../config';

interface PlayingCardProps {
	cardState: CardState;
	onCardPressed: () => void;
	width: number;
	isActive: boolean;
	disabled: boolean;
}

const PlayingCard: React.FC<PlayingCardProps> = memo(
	({ cardState, onCardPressed, width, isActive, disabled }) => {
		const { isFlipped, image } = cardState;
		const height = width * config.CARD_ASPECT_RATIO;
		const marginPadding = width * 0.2;

		const imageUrl = isFlipped ? image : config.CARD_BACK_URL;
		const shadowStyle: ViewStyle = Platform.select({
			web: {
				boxShadow: '0px 12px 24px rgba(0, 0, 0, 0.35)',
			},
			default: {
				shadowColor: '#000',
				shadowOffset: { width: 0, height: 2 },
				shadowOpacity: 0.25,
				shadowRadius: 3.84,
				elevation: 5,
			},
		}) as ViewStyle;

		return (
			<Pressable
				onPress={onCardPressed}
				disabled={disabled}
				style={({ pressed }) => [
					styles.pressable,
					shadowStyle,
					{
						width,
						height,
						marginHorizontal: marginPadding / 2,
					},
					isActive && styles.active,
					disabled && styles.disabled,
					pressed && !disabled && styles.pressed,
				]}
				accessibilityRole="button"
				accessibilityState={{ disabled, selected: isFlipped }}
			>
				<Image
					style={styles.image}
					source={{ uri: imageUrl }}
					resizeMode="contain"
				/>
			</Pressable>
		);
	},
	(prevProps, nextProps) => {
		// Custom comparison for memo optimization
		return (
			prevProps.cardState.isFlipped === nextProps.cardState.isFlipped &&
			prevProps.cardState.image === nextProps.cardState.image &&
			prevProps.width === nextProps.width &&
			prevProps.isActive === nextProps.isActive &&
			prevProps.disabled === nextProps.disabled
		);
	}
);

PlayingCard.displayName = 'PlayingCard';

const styles = StyleSheet.create({
	pressable: {
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 12,
		backgroundColor: '#ffffff',
	},
	image: {
		width: '100%',
		height: '100%',
		borderRadius: 12,
	},
	active: {
		borderWidth: 3,
		borderColor: '#5cb85c',
	},
	disabled: {
		opacity: 0.7,
	},
	pressed: {
		transform: [{ scale: 0.98 }],
	},
});

export default PlayingCard;
