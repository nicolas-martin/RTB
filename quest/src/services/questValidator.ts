import { QuestConfig, QuestCondition } from '../types/quest';

type CustomValidator = (data: any) => boolean;

export class QuestValidator {
	private customValidators: Map<string, CustomValidator> = new Map();

	constructor() {
		this.registerDefaultValidators();
	}

	private registerDefaultValidators() {
		this.registerCustomValidator('validateBustedRound2', (data) => {
			if (!data.player?.games || !Array.isArray(data.player.games)) {
				return false;
			}

			return data.player.games.some((game: any) => {
				if (
					game.status !== 'BUSTED' ||
					!game.rounds ||
					game.rounds.length < 2
				) {
					return false;
				}

				const round0 = game.rounds.find((r: any) => r.roundIndex === 0);
				const round1 = game.rounds.find((r: any) => r.roundIndex === 1);

				return (
					round0 &&
					round1 &&
					round0.roundOutcome &&
					round1.roundOutcome &&
					round0.roundOutcome === round1.roundOutcome
				);
			});
		});
	}

	registerCustomValidator(name: string, validator: CustomValidator) {
		this.customValidators.set(name, validator);
	}

	validateQuest(
		quest: QuestConfig,
		queryResult: any
	): { completed: boolean; progress?: number } {
		try {
			switch (quest.type) {
				case 'singular':
					return this.validateSingular(quest, queryResult);
				case 'progress':
					return this.validateProgress(quest, queryResult);
				case 'sequential':
					return this.validateSequential(quest, queryResult);
				case 'conditional':
					return this.validateConditional(quest, queryResult);
				default:
					return { completed: false };
			}
		} catch (error) {
			console.error(`Quest validation error for ${quest.id}:`, error);
			return { completed: false };
		}
	}

	private validateSingular(
		quest: QuestConfig,
		queryResult: any
	): { completed: boolean } {
		if (!quest.condition) {
			return { completed: false };
		}

		const conditionValue = this.resolveFieldValue(queryResult, quest.condition.field);

		return {
			completed: this.evaluateCondition(quest.condition, conditionValue),
		};
	}

	private validateProgress(
		quest: QuestConfig,
		queryResult: any
	): { completed: boolean; progress: number } {
		if (!quest.condition) {
			return { completed: false, progress: 0 };
		}

		const fieldValue = this.resolveFieldValue(queryResult, quest.condition.field);
		const numericValue =
			typeof fieldValue === 'number' ? fieldValue : parseFloat(fieldValue) || 0;

		const completed = this.evaluateCondition(quest.condition, fieldValue);

		return { completed, progress: numericValue };
	}

	private validateSequential(
		quest: QuestConfig,
		queryResult: any
	): { completed: boolean; progress?: number } {
		if (!quest.sequenceCondition || !quest.condition) {
			return { completed: false };
		}

		const data = this.getNestedValue(queryResult, quest.condition.field);

		if (!Array.isArray(data)) {
			return { completed: false };
		}

		const sequenceField = quest.sequenceCondition.field;
		const sequenceLength = quest.sequenceCondition.sequenceLength;
		const itemConditionField = quest.condition.itemConditionField;

		const validItems = itemConditionField
			? data.filter((item: any) =>
				this.evaluateCondition(quest.condition!, item[itemConditionField])
			)
			: data;

		if (validItems.length < sequenceLength) {
			return {
				completed: false,
				progress: (validItems.length / sequenceLength) * 100,
			};
		}

		for (let i = 0; i <= validItems.length - sequenceLength; i++) {
			let isSequential = true;
			const startIndex = validItems[i][sequenceField];

			for (let j = 1; j < sequenceLength; j++) {
				const currentIndex = validItems[i + j][sequenceField];
				if (currentIndex !== startIndex + j) {
					isSequential = false;
					break;
				}
			}

			if (isSequential) {
				return { completed: true, progress: 100 };
			}
		}

		return {
			completed: false,
			progress: (validItems.length / sequenceLength) * 100,
		};
	}

	private validateConditional(
		quest: QuestConfig,
		queryResult: any
	): { completed: boolean } {
		if (quest.customValidator) {
			const validator = this.customValidators.get(quest.customValidator);
			if (validator) {
				return { completed: validator(queryResult) };
			}
		}

		if (!quest.conditions || quest.conditions.length === 0) {
			return { completed: false };
		}

		const data = this.getNestedValue(queryResult, quest.conditions[0].field);

		if (Array.isArray(data)) {
			return {
				completed: data.some((item) =>
					quest.conditions!.every((condition) => {
						const itemField = condition.itemConditionField || condition.field;
						const value = this.getNestedValue(item, itemField);
						return this.evaluateCondition(condition, value);
					})
				),
			};
		}

		return {
			completed: quest.conditions.every((condition) => {
				const value = this.getNestedValue(data, condition.field);
				return this.evaluateCondition(condition, value);
			}),
		};
	}

	private evaluateCondition(condition: QuestCondition, value: any): boolean {
		const { operator, value: expectedValue } = condition;

		switch (operator) {
			case '=':
				return value == expectedValue;
			case '!=':
				return value != expectedValue;
			case '>':
				return Number(value) > Number(expectedValue);
			case '>=':
				return Number(value) >= Number(expectedValue);
			case '<':
				return Number(value) < Number(expectedValue);
			case '<=':
				return Number(value) <= Number(expectedValue);
			default:
				return false;
		}
	}

	private resolveFieldValue(obj: any, field: string): any {
		const lenMatch = field.match(/^len\((.+)\)$/);
		if (lenMatch) {
			const value = this.getNestedValue(obj, lenMatch[1]);
			return Array.isArray(value) ? value.length : 0;
		}
		return this.getNestedValue(obj, field);
	}

	private getNestedValue(obj: any, path: string): any {
		return path.split('.').reduce((current, key) => current?.[key], obj);
	}
}

export const questValidator = new QuestValidator();
