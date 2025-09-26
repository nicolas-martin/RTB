import { useState, useCallback } from 'react';
import { ProjectMetadata, Quest } from '../src/types/quest';
import { projectManager } from '../src/services/projectManager';

interface ProjectQuestsConfig {
	projectId: string;
	tomlPath: string;
}

export const useProjectQuests = (playerId?: string) => {
	const [projects, setProjects] = useState<ProjectMetadata[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const loadProject = useCallback(async (config: ProjectQuestsConfig) => {
		try {
			setLoading(true);
			setError(null);

			await projectManager.loadProject(config.projectId, config.tomlPath);

			const allProjects = projectManager.getAllProjects();
			setProjects(allProjects);
		} catch (err) {
			console.error(`Failed to load project ${config.projectId}:`, err);
			setError(err instanceof Error ? err.message : 'Failed to load project');
		} finally {
			setLoading(false);
		}
	}, []);

	const loadProjects = useCallback(async (configs: ProjectQuestsConfig[]) => {
		try {
			setLoading(true);
			setError(null);

			await Promise.all(
				configs.map((config) =>
					projectManager.loadProject(config.projectId, config.tomlPath)
				)
			);

			const allProjects = projectManager.getAllProjects();
			setProjects(allProjects);
		} catch (err) {
			console.error('Failed to load projects:', err);
			setError(err instanceof Error ? err.message : 'Failed to load projects');
		} finally {
			setLoading(false);
		}
	}, []);

	const getQuestsForProject = useCallback((projectId: string): Quest[] => {
		return projectManager.getQuestsForProject(projectId);
	}, []);

	const getActiveQuestsForProject = useCallback(
		(projectId: string): Quest[] => {
			return projectManager.getActiveQuestsForProject(projectId);
		},
		[]
	);

	const checkQuestsForProject = useCallback(
		async (projectId: string) => {
			if (!playerId) {
				console.warn('No player ID provided');
				return [];
			}

			try {
				setLoading(true);
				return await projectManager.checkQuestsForProject(projectId, playerId);
			} catch (err) {
				console.error(`Failed to check quests for project ${projectId}:`, err);
				setError(err instanceof Error ? err.message : 'Failed to check quests');
				return [];
			} finally {
				setLoading(false);
			}
		},
		[playerId]
	);

	const getAllQuests = useCallback(() => {
		return projectManager.getAllQuests();
	}, []);

	const getAllActiveQuests = useCallback(() => {
		return projectManager.getAllActiveQuests();
	}, []);

	const clearProjectProgress = useCallback((projectId: string) => {
		projectManager.clearProjectProgress(projectId);
	}, []);

	const clearAllProgress = useCallback(() => {
		projectManager.clearAllProgress();
	}, []);

	return {
		projects,
		loading,
		error,
		loadProject,
		loadProjects,
		getQuestsForProject,
		getActiveQuestsForProject,
		checkQuestsForProject,
		getAllQuests,
		getAllActiveQuests,
		clearProjectProgress,
		clearAllProgress,
	};
};
