import React from 'react';
import { GameProvider } from './contexts/GameContext';
import ErrorBoundary from './components/ErrorBoundary';
import App from './App';
import AppWeb3 from './AppWeb3';
import { Platform } from 'react-native';

const AppWrapper: React.FC = () => {
	// Use Web3 version for web platform
	const isWeb = Platform.OS === 'web';

	if (isWeb) {
		return (
			<ErrorBoundary>
				<AppWeb3 />
			</ErrorBoundary>
		);
	}

	return (
		<ErrorBoundary>
			<GameProvider>
				<App />
			</GameProvider>
		</ErrorBoundary>
	);
};

export default AppWrapper;
