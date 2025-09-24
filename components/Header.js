import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Header = ({ title }) => {
    return (
        <View style={styles.header}>
            <Text style={styles.text}>{title}</Text>
            <Text style={styles.subtext}>A single-player drinking game based on Irish Poker.</Text>
        </View>
    );
};

Header.defaultProps = {
    title: 'Ride The Bus!'
};

const styles = StyleSheet.create({
    header: {
        height: 60,
        padding: 15,
    },
    subtext: {
        color: 'white',
        fontSize: 15,
        fontStyle: 'italic',
        textAlign: 'center'
    },
    text: {
        color: 'white',
        fontSize: 30,
        textAlign: 'center'
    }
})

export default Header;
