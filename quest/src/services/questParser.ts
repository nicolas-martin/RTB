import * as toml from 'toml';
import { QuestConfig, ProjectMetadata } from '../types/quest';
import { BaseQuest, ConditionalQuest, ProgressQuest, CustomQuest } from '../models';

export interface ProjectWithQuests {
	project: ProjectMetadata;
	quests: BaseQuest[];
}

export class QuestParser {
	async parseProjectFromFile(tomlContent: string): Promise<ProjectWithQuests> {
		try {
			const parsed = toml.parse(tomlContent);

			if (!parsed.project) {
				throw new Error('Invalid TOML structure: missing "project" section');
			}

			if (!parsed.quest || !Array.isArray(parsed.quest)) {
				throw new Error('Invalid TOML structure: expected "quest" array');
			}

			const project = this.validateAndMapProject(parsed.project);
			const quests = parsed.quest.map((q: any) => this.createQuestInstance(q, project.id));

			return { project, quests };
		} catch (error) {
			console.error('Failed to parse project:', error);
			throw new Error(
				`Project parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	private createQuestInstance(questData: any, projectId: string): BaseQuest {
		const config = this.validateAndMapQuest(questData);
		const { baseType, params } = this.parseTypeWithParams(questData.type);

		switch (baseType) {
			case 'conditional':
				return new ConditionalQuest(config);
			case 'progress':
				return new ProgressQuest(config);
			case 'custom':
				return new CustomQuest(config, projectId, params);
			default:
				throw new Error(`Unknown quest type: ${baseType}`);
		}
	}

	private validateAndMapProject(projectData: any): ProjectMetadata {
		const required = ['id', 'name', 'description', 'graphqlEndpoint'];
		for (const field of required) {
			if (!projectData[field]) {
				throw new Error(`Missing required project field: ${field}`);
			}
		}

		return {
			id: projectData.id,
			name: projectData.name,
			description: projectData.description,
			graphqlEndpoint: projectData.graphqlEndpoint,
		};
	}

	private parseTypeWithParams(typeString: string): { baseType: string; params: any[] } {
		const match = typeString.match(/^(\w+)(?:\((.*)\))?$/);
		if (!match) {
			throw new Error(`Invalid type format: ${typeString}`);
		}

		const baseType = match[1];
		const paramsString = match[2];

		if (!paramsString) {
			return { baseType, params: [] };
		}

		// Parse comma-separated parameters, handling numbers and strings
		const params = paramsString.split(',').map(param => {
			const trimmed = param.trim();
			// Try to parse as number
			if (!isNaN(Number(trimmed))) {
				return Number(trimmed);
			}
			// Return as string (remove quotes if present)
			return trimmed.replace(/^["']|["']$/g, '');
		});

		return { baseType, params };
	}

	private validateAndMapQuest(questData: any): QuestConfig {
		const required = [
			'id',
			'title',
			'description',
			'reward',
			'type',
			'query',
		];
		for (const field of required) {
			if (!questData[field]) {
				throw new Error(`Missing required field: ${field}`);
			}
		}

		const { baseType } = this.parseTypeWithParams(questData.type);
		const validTypes = ['conditional', 'progress', 'custom'];
		if (!validTypes.includes(baseType)) {
			throw new Error(`Invalid quest type: ${baseType}`);
		}

		return {
			id: questData.id,
			title: questData.title,
			description: questData.description,
			reward: questData.reward,
			type: baseType,
			query: questData.query.trim(),
			startDate: questData.startDate,
			endDate: questData.endDate,
			conditions: questData.conditions,
			validatorParams: questData.validatorParams,
			variables: questData.variables,
		};
	}
}

export const questParser = new QuestParser();
