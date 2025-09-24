import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface HeaderProps {
	title?: string;
}

const Header: React.FC<HeaderProps> = memo(({ title = 'Ride The Bus!' }) => {
	return (
		<View style={styles.header}>
			<Text style={styles.title}>{title}</Text>
		</View>
	);
});

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
});

export default Header;
