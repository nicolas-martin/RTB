import React, { useEffect } from 'react';
import { TextInput, StyleSheet } from 'react-native';
import { animate, useMotionValue, useTransform } from 'motion/react';

interface AnimatedPayoutProps {
	currentPayout: string;
}

export const AnimatedPayout: React.FC<AnimatedPayoutProps> = ({
	currentPayout,
}) => {
	const count = useMotionValue(0);
	const rounded = useTransform(() => {
		const val = count.get();
		return val.toFixed(3);
	});
	const [displayValue, setDisplayValue] = React.useState('0.000');

	useEffect(() => {
		const target = parseFloat(currentPayout) || 0;
		const controls = animate(count, target, {
			duration: 1,
		});

		const unsubscribe = rounded.on('change', (latest) => {
			setDisplayValue(latest);
		});

		return () => {
			controls.stop();
			unsubscribe();
		};
	}, [currentPayout, count, rounded]);

	return (
		<TextInput
			style={styles.betInput}
			value={displayValue}
			editable={false}
		/>
	);
};

const styles = StyleSheet.create({
	betInput: {
		backgroundColor: '#2c2c54',
		color: '#fff',
		paddingHorizontal: 15,
		paddingVertical: 8,
		borderRadius: 5,
		minWidth: 100,
		fontSize: 16,
	},
});

