import { ProjectMetadata, Quest } from '../types/quest';
import { QuestService } from './questService';

export class ProjectManager {
	private projects: Map<string, QuestService> = new Map();

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
}

export const projectManager = new ProjectManager();
