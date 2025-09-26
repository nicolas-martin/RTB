import * as toml from 'toml';
import { QuestConfig, ProjectMetadata } from '../types/quest';
import { BaseQuest, ConditionalQuest, ProgressQuest, SequentialQuest, CustomQuest } from '../models';

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
			const quests = parsed.quest.map((q: any) => this.createQuestInstance(q));

			return { project, quests };
		} catch (error) {
			console.error('Failed to parse project:', error);
			throw new Error(
				`Project parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	private createQuestInstance(questData: any): BaseQuest {
		const config = this.validateAndMapQuest(questData);

		switch (config.type) {
			case 'conditional':
				return new ConditionalQuest(config);
			case 'progress':
				return new ProgressQuest(config);
			case 'sequential':
				return new SequentialQuest(config);
			case 'custom':
				return new CustomQuest(config);
			default:
				throw new Error(`Unknown quest type: ${config.type}`);
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

		const validTypes = ['conditional', 'progress', 'sequential', 'custom'];
		if (!validTypes.includes(questData.type)) {
			throw new Error(`Invalid quest type: ${questData.type}`);
		}

		return {
			id: questData.id,
			title: questData.title,
			description: questData.description,
			reward: questData.reward,
			type: questData.type,
			query: questData.query.trim(),
			startDate: questData.startDate,
			endDate: questData.endDate,
			conditions: questData.conditions,
			sequenceCondition: questData.sequenceCondition,
			validatorFile: questData.validatorFile,
			validatorFunction: questData.validatorFunction,
			validatorParams: questData.validatorParams,
		};
	}
}

export const questParser = new QuestParser();
