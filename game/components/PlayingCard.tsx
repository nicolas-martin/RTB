import React, { memo, useEffect, useRef } from 'react';
import {
	Animated,
	Image,
	Platform,
	Pressable,
	StyleSheet,
	View,
	ViewStyle,
} from 'react-native';
import { CardState } from '../types';
import { config } from '../src/config';
import { useSounds, SoundType } from '../hooks/useSounds';

interface PlayingCardProps {
	cardState: CardState;
	onCardPressed: () => void;
	width: number;
	disabled: boolean;
}

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

const PlayingCard: React.FC<PlayingCardProps> = memo(
	({ cardState, onCardPressed, width, disabled }) => {
		const { isFlipped, card } = cardState;
		const height = width * config.CARD_ASPECT_RATIO;
		const marginPadding = width * 0.2;
		const rotation = useRef(new Animated.Value(isFlipped ? 180 : 0)).current;
		const frontImageUri = card?.image ?? config.CARD_BACK_URL;
		const { playSound } = useSounds();

		useEffect(() => {
			if (isFlipped) {
				Animated.spring(rotation, {
					toValue: 180,
					useNativeDriver: true,
					friction: 8,
					tension: 12,
				}).start();
			} else {
				rotation.setValue(0);
			}
		}, [isFlipped, rotation, frontImageUri]);

		const frontAnimatedStyle = {
			transform: [
				{ perspective: 1000 },
				{
					rotateY: rotation.interpolate({
						inputRange: [0, 180],
						outputRange: ['180deg', '360deg'],
					}),
				},
			],
		};

		const backAnimatedStyle = {
			transform: [
				{ perspective: 1000 },
				{
					rotateY: rotation.interpolate({
						inputRange: [0, 180],
						outputRange: ['0deg', '180deg'],
					}),
				},
			],
		};

		return (
			<Pressable
				onPress={() => {
					playSound(SoundType.CardSelect);
					onCardPressed();
				}}
				disabled={disabled}
				style={({ pressed }) => [
					styles.pressable,
					shadowStyle,
					{
						width,
						height,
						marginHorizontal: marginPadding / 2,
					},
					pressed && !disabled && styles.pressed,
				]}
				accessibilityRole="button"
				accessibilityState={{ disabled, selected: isFlipped }}
			>
				<View style={styles.cardInner}>
					<Animated.View
						style={[styles.cardFace, styles.cardFront, frontAnimatedStyle]}
					>
						<Image
							style={styles.cardImage}
							source={{ uri: frontImageUri }}
							resizeMode="contain"
						/>
					</Animated.View>
					<Animated.View
						style={[styles.cardFace, styles.cardBack, backAnimatedStyle]}
					>
						<Image
							style={styles.cardImage}
							source={{ uri: config.CARD_BACK_URL }}
							resizeMode="contain"
						/>
					</Animated.View>
				</View>
			</Pressable>
		);
	},
	(prevProps, nextProps) =>
		prevProps.cardState.isFlipped === nextProps.cardState.isFlipped &&
		prevProps.cardState.card?.image === nextProps.cardState.card?.image &&
		prevProps.width === nextProps.width &&
		prevProps.disabled === nextProps.disabled
);

PlayingCard.displayName = 'PlayingCard';

const styles = StyleSheet.create({
	pressable: {
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 12,
		backgroundColor: 'transparent',
		overflow: 'hidden',
	},
	cardInner: {
		width: '100%',
		height: '100%',
		position: 'relative',
	},
	cardFace: {
		position: 'absolute',
		top: 0,
		left: 0,
		width: '100%',
		height: '100%',
		backfaceVisibility: 'hidden',
	},
	cardFront: {},
	cardBack: {},
	cardImage: {
		width: '100%',
		height: '100%',
		borderRadius: 12,
	},
	pressed: {
		transform: [{ scale: 0.98 }],
	},
});

export default PlayingCard;
