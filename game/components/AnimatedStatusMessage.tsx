import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { motion, spring } from 'motion/react';

interface AnimatedStatusMessageProps {
	error: string | null;
	gameLost: boolean;
	gameWon: boolean;
	statusMessage: string;
}

export const AnimatedStatusMessage: React.FC<AnimatedStatusMessageProps> = ({
	error,
	gameLost,
	gameWon,
	statusMessage,
}) => {
	const isVisible = error || statusMessage;

	return (
		<motion.div
			initial={{ scale: 1, y: 0 }}
			animate={{
				scale: gameWon ? [1, 1.2, 1] : 1,
				y: gameWon ? [0, -20, 0] : 0,
			}}
			transition={{
				duration: 0.6,
				easing: spring(),
			}}
			style={{
				borderWidth: 1,
				borderRadius: 5,
				padding: 10,
				marginBottom: 30,
				marginTop: 5,
				maxWidth: 600,
				alignSelf: 'center',
				width: '90%',
				height: 70,
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				opacity: isVisible ? 1 : 0,
				borderColor: isVisible
					? error || gameLost
						? '#e74c3c'
						: '#2ecc71'
					: 'transparent',
				backgroundColor: isVisible
					? error || gameLost
						? 'rgba(231, 76, 60, 0.15)'
						: 'rgba(46, 204, 113, 0.15)'
					: 'transparent',
			}}
		>
			{error ? (
				<>
					<Text style={styles.errorTitle}>Error:</Text>
					<Text style={styles.errorText}>{error}</Text>
				</>
			) : (
				<Text style={styles.statusText}>{statusMessage}</Text>
			)}
		</motion.div>
	);
};

const styles = StyleSheet.create({
	statusText: {
		color: '#fff',
		fontSize: 16,
		textAlign: 'center',
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
	},
});
