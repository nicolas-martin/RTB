import React from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import App from './App';

const AppWrapper: React.FC = () => {
	return (
		<ErrorBoundary>
			<App />
		</ErrorBoundary>
	);
};

export default AppWrapper;
