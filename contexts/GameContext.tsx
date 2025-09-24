import React, { createContext, useContext, ReactNode } from 'react';
import { useGameLogic } from '../hooks/useGameLogic';
import { GameContextType } from '../types';

const GameContext = createContext<GameContextType | undefined>(undefined);

interface GameProviderProps {
	children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
	const gameLogic = useGameLogic();

	return (
		<GameContext.Provider value={gameLogic}>{children}</GameContext.Provider>
	);
};

export const useGame = (): GameContextType => {
	const context = useContext(GameContext);
	if (!context) {
		throw new Error('useGame must be used within a GameProvider');
	}
	return context;
};

// Export for testing purposes
export { GameContext };
