import { ProjectMetadata, Quest } from '../types/quest';
import { QuestService } from './questService';

export class ProjectManager {
	private projects: Map<string, QuestService> = new Map();
	private availableProjects = ['rtb', 'gluex']; // Add more project IDs here

	async loadProject(projectId: string, tomlPath: string): Promise<void> {
		try {
			const response = await fetch(tomlPath);
			const tomlContent = await response.text();

			const questService = new QuestService();
			await questService.loadProject(tomlContent);

			this.projects.set(projectId, questService);
		} catch (error) {
			console.error(`Failed to load project ${projectId}:`, error);
			throw error;
		}
	}

	async loadAllProjects(): Promise<void> {
		for (const projectId of this.availableProjects) {
			try {
				await this.loadProject(projectId, `/${projectId}/project.toml`);
			} catch (error) {
				console.warn(`Failed to load project ${projectId}:`, error);
				// Continue loading other projects even if one fails
			}
		}
	}

	getProject(projectId: string): ProjectMetadata | null {
		const service = this.projects.get(projectId);
		return service?.getProject() ?? null;
	}

	getAllProjects(): ProjectMetadata[] {
		const projects: ProjectMetadata[] = [];
		this.projects.forEach((service) => {
			const project = service.getProject();
			if (project) {
				projects.push(project);
			}
		});
		return projects;
	}

	getQuestService(projectId: string): QuestService | null {
		return this.projects.get(projectId) ?? null;
	}

	async checkQuestsForProject(
		projectId: string,
		playerId: string
	): Promise<Quest[]> {
		const service = this.projects.get(projectId);
		if (!service) {
			console.error(`Project ${projectId} not found`);
			return [];
		}

		return await service.checkAllQuests(playerId);
	}

	getQuestsForProject(projectId: string): Quest[] {
		const service = this.projects.get(projectId);
		return service?.getQuestsWithProgress() ?? [];
	}

	getActiveQuestsForProject(projectId: string): Quest[] {
		const service = this.projects.get(projectId);
		return service?.getActiveQuests() ?? [];
	}

	getAllQuests(): { project: ProjectMetadata; quests: Quest[] }[] {
		const result: { project: ProjectMetadata; quests: Quest[] }[] = [];

		this.projects.forEach((service) => {
			const project = service.getProject();
			if (project) {
				result.push({
					project,
					quests: service.getQuestsWithProgress(),
				});
			}
		});

		return result;
	}

	getAllActiveQuests(): { project: ProjectMetadata; quests: Quest[] }[] {
		const result: { project: ProjectMetadata; quests: Quest[] }[] = [];

		this.projects.forEach((service) => {
			const project = service.getProject();
			if (project) {
				const activeQuests = service.getActiveQuests();
				if (activeQuests.length > 0) {
					result.push({
						project,
						quests: activeQuests,
					});
				}
			}
		});

		return result;
	}

	clearProjectProgress(projectId: string): void {
		const service = this.projects.get(projectId);
		service?.clearProgress();
	}

	clearAllProgress(): void {
		this.projects.forEach((service) => {
			service.clearProgress();
		});
	}

	async checkAllProjectsProgress(playerId: string): Promise<{ project: ProjectMetadata; quests: Quest[] }[]> {
		const results: { project: ProjectMetadata; quests: Quest[] }[] = [];

		for (const [projectId, service] of this.projects.entries()) {
			try {
				const project = service.getProject();
				if (project) {
					const updatedQuests = await service.checkAllQuests(playerId);
					results.push({ project, quests: updatedQuests });
				}
			} catch (error) {
				console.error(`Failed to check progress for project ${projectId}:`, error);
				// Still include the project with existing quest data
				const project = service.getProject();
				if (project) {
					results.push({ project, quests: service.getQuestsWithProgress() });
				}
			}
		}

		return results;
	}

	async getUserPointsForProject(projectId: string, playerId: string): Promise<number> {
		const service = this.projects.get(projectId);
		if (!service) return 0;

		return await service.getUserPoints(playerId);
	}

	async getAllUserPoints(playerId: string): Promise<Map<string, number>> {
		const pointsMap = new Map<string, number>();

		for (const [projectId, service] of this.projects.entries()) {
			try {
				const points = await service.getUserPoints(playerId);
				pointsMap.set(projectId, points);
			} catch (error) {
				console.error(`Failed to get points for project ${projectId}:`, error);
				pointsMap.set(projectId, 0);
			}
		}

		return pointsMap;
	}

	async getCompletedQuestsForProject(projectId: string, playerId: string): Promise<string[]> {
		const service = this.projects.get(projectId);
		if (!service) return [];

		return await service.getCompletedQuestsFromDb(playerId);
	}
}

export const projectManager = new ProjectManager();
