import { useState, useEffect, useCallback, useRef } from 'react';
import { Quest } from '../src/types/quest';
import { QuestService } from '../src/services/questService';
import { config } from '../src/config';

export const useQuests = (playerId?: string) => {
	const [quests, setQuests] = useState<Quest[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const questServiceRef = useRef<QuestService | null>(null);

	useEffect(() => {
		const initializeQuests = async () => {
			try {
				setLoading(true);
				setError(null);

				if (!questServiceRef.current) {
					questServiceRef.current = new QuestService(config.GRAPHQL_ENDPOINT);
				}

				const response = await fetch('/src/quests/quests.toml');
				const tomlContent = await response.text();

				await questServiceRef.current.loadQuests(tomlContent);
				const loadedQuests = questServiceRef.current.getQuestsWithProgress();
				setQuests(loadedQuests);
			} catch (err) {
				console.error('Failed to initialize quests:', err);
				setError(err instanceof Error ? err.message : 'Failed to load quests');
			} finally {
				setLoading(false);
			}
		};

		initializeQuests();
	}, []);

	const checkQuest = useCallback(
		async (questId: string) => {
			if (!questServiceRef.current || !playerId) {
				console.warn('Quest service not initialized or no player ID provided');
				return null;
			}

			try {
				const quest = await questServiceRef.current.checkQuest(
					questId,
					playerId
				);
				if (quest) {
					setQuests((prev) => prev.map((q) => (q.id === questId ? quest : q)));
				}
				return quest;
			} catch (err) {
				console.error(`Failed to check quest ${questId}:`, err);
				return null;
			}
		},
		[playerId]
	);

	const checkAllQuests = useCallback(async () => {
		if (!questServiceRef.current || !playerId) {
			console.warn('Quest service not initialized or no player ID provided');
			return [];
		}

		try {
			setLoading(true);
			const updatedQuests =
				await questServiceRef.current.checkAllQuests(playerId);
			setQuests(updatedQuests);
			return updatedQuests;
		} catch (err) {
			console.error('Failed to check all quests:', err);
			setError(err instanceof Error ? err.message : 'Failed to check quests');
			return [];
		} finally {
			setLoading(false);
		}
	}, [playerId]);

	const refreshQuests = useCallback(() => {
		if (questServiceRef.current) {
			const loadedQuests = questServiceRef.current.getQuestsWithProgress();
			setQuests(loadedQuests);
		}
	}, []);

	const getActiveQuests = useCallback(() => {
		return questServiceRef.current?.getActiveQuests() ?? [];
	}, []);

	const getCompletedQuests = useCallback(() => {
		return questServiceRef.current?.getCompletedQuests() ?? [];
	}, []);

	const getIncompleteQuests = useCallback(() => {
		return questServiceRef.current?.getIncompleteQuests() ?? [];
	}, []);

	const clearProgress = useCallback(() => {
		questServiceRef.current?.clearProgress();
		refreshQuests();
	}, [refreshQuests]);

	return {
		quests,
		loading,
		error,
		checkQuest,
		checkAllQuests,
		refreshQuests,
		getActiveQuests,
		getCompletedQuests,
		getIncompleteQuests,
		clearProgress,
	};
};
