import * as toml from 'toml';
import {
	QuestConfig,
	ProjectMetadata,
	ProjectWithQuests,
} from '../types/quest';

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
			const quests = parsed.quest.map((q: any) => this.validateAndMapQuest(q));

			return { project, quests };
		} catch (error) {
			console.error('Failed to parse project:', error);
			throw new Error(
				`Project parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
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
			'resultField',
		];
		for (const field of required) {
			if (!questData[field]) {
				throw new Error(`Missing required field: ${field}`);
			}
		}

		const validTypes = ['singular', 'progress', 'sequential', 'conditional'];
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
			resultField: questData.resultField,
			startDate: questData.startDate,
			endDate: questData.endDate,
			condition: questData.condition,
			sequenceCondition: questData.sequenceCondition,
			conditions: questData.conditions,
			customValidator: questData.customValidator,
			targetValue: questData.targetValue,
		};
	}
}

export const questParser = new QuestParser();
