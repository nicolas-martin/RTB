import React from 'react';
import { GameProvider } from './contexts/GameContext';
import ErrorBoundary from './components/ErrorBoundary';
import App from './App';

const AppWrapper: React.FC = () => {
	return (
		<ErrorBoundary>
			<GameProvider>
				<App />
			</GameProvider>
		</ErrorBoundary>
	);
};

export default AppWrapper;
