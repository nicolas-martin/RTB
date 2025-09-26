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
		const value = this.getNestedValue(queryResult, quest.resultField);

		if (quest.condition) {
			const conditionValue = Array.isArray(value) ? value.length : value;
			return {
				completed: this.evaluateCondition(quest.condition, conditionValue),
			};
		}

		return { completed: !!value };
	}

	private validateProgress(
		quest: QuestConfig,
		queryResult: any
	): { completed: boolean; progress: number } {
		const value = this.getNestedValue(queryResult, quest.resultField);
		const numericValue =
			typeof value === 'number' ? value : parseFloat(value) || 0;

		const target = quest.targetValue || quest.condition?.value || 0;
		const targetNum =
			typeof target === 'number' ? target : parseFloat(target as string) || 0;

		const progress =
			targetNum > 0 ? Math.min((numericValue / targetNum) * 100, 100) : 0;
		const completed = quest.condition
			? this.evaluateCondition(quest.condition, numericValue)
			: numericValue >= targetNum;

		return { completed, progress };
	}

	private validateSequential(
		quest: QuestConfig,
		queryResult: any
	): { completed: boolean; progress?: number } {
		const data = this.getNestedValue(queryResult, quest.resultField);

		if (!Array.isArray(data) || !quest.sequenceCondition || !quest.condition) {
			return { completed: false };
		}

		const sequenceField = quest.sequenceCondition.field;
		const sequenceLength = quest.sequenceCondition.sequenceLength;

		const validItems = data.filter((item: any) =>
			this.evaluateCondition(quest.condition!, item[quest.condition!.field])
		);

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

		const data = this.getNestedValue(queryResult, quest.resultField);

		if (Array.isArray(data)) {
			return {
				completed: data.some((item) =>
					quest.conditions!.every((condition) => {
						const value = this.getNestedValue(item, condition.field);
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

	private getNestedValue(obj: any, path: string): any {
		return path.split('.').reduce((current, key) => current?.[key], obj);
	}
}

export const questValidator = new QuestValidator();
