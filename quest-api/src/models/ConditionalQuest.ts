import { BaseQuest, ValidationResult } from './BaseQuest.js';

export class ConditionalQuest extends BaseQuest {
	validate(queryResult: any): ValidationResult {
		if (!this.config.conditions || this.config.conditions.length === 0) {
			return { completed: false };
		}

		const condition = this.config.conditions[0];
		const conditionValue = this.resolveFieldValue(queryResult, condition.field);

		const completed = this.evaluateCondition(condition, conditionValue);

		return {
			completed: completed,
		};
	}
}
