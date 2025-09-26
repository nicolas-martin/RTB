import { BaseQuest, ValidationResult } from './BaseQuest';

export class SequentialQuest extends BaseQuest {
	validate(queryResult: any): ValidationResult {
		if (!this.config.sequenceCondition || !this.config.conditions || this.config.conditions.length === 0) {
			return { completed: false };
		}

		const condition = this.config.conditions[0];
		const data = this.getNestedValue(queryResult, condition.field);

		if (!Array.isArray(data)) {
			return { completed: false };
		}

		const sequenceField = this.config.sequenceCondition.field;
		const sequenceLength = this.config.sequenceCondition.sequenceLength;
		const itemConditionField = condition.itemConditionField;

		const validItems = itemConditionField
			? data.filter((item: any) =>
				this.evaluateCondition(condition, item[itemConditionField])
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
}