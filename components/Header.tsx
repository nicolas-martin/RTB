import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface HeaderProps {
	title?: string;
	subtitle?: string;
}

const Header: React.FC<HeaderProps> = memo(
	({
		title = 'Ride The Bus!',
		subtitle = 'A single-player drinking game based on Irish Poker.',
	}) => {
		return (
			<View style={styles.header}>
				<Text style={styles.title}>{title}</Text>
				<Text style={styles.subtitle}>{subtitle}</Text>
			</View>
		);
	}
);

Header.displayName = 'Header';

const styles = StyleSheet.create({
	header: {
		paddingTop: 20,
		paddingBottom: 10,
		paddingHorizontal: 15,
		alignItems: 'center',
	},
	title: {
		color: 'white',
		fontSize: 32,
		fontWeight: 'bold',
		textAlign: 'center',
		marginBottom: 5,
	},
	subtitle: {
		color: 'rgba(255, 255, 255, 0.8)',
		fontSize: 14,
		fontStyle: 'italic',
		textAlign: 'center',
	},
});

export default Header;
