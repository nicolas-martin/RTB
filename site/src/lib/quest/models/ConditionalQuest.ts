import { BaseQuest } from './BaseQuest';
import type { ValidationResult } from './BaseQuest';

export class ConditionalQuest extends BaseQuest {
	validate(queryResult: any): ValidationResult {
		if (!this.config.conditions || this.config.conditions.length === 0) {
			return { completed: false };
		}

		const condition = this.config.conditions[0];
		const conditionValue = this.resolveFieldValue(queryResult, condition.field);

		const completed = this.evaluateCondition(condition, conditionValue);

		console.log(`[ProgressQuest] ${this.config.id}`, {
			questId: this.config.id,
			condition,
			conditionValue,
			queryResult,
			completed
		});

		return {
			completed: completed,
		};
	}
}
