import { BaseQuest, ValidationResult } from './BaseQuest';

export class ProgressQuest extends BaseQuest {
	validate(queryResult: any): ValidationResult {
		if (!this.config.conditions || this.config.conditions.length === 0) {
			return { completed: false, progress: 0 };
		}

		const condition = this.config.conditions[0];
		const fieldValue = this.resolveFieldValue(queryResult, condition.field);
		const numericValue =
			typeof fieldValue === 'number' ? fieldValue : parseFloat(fieldValue) || 0;

		const completed = this.evaluateCondition(condition, fieldValue);

		console.log(`[ProgressQuest ${this.config.id}]`, {
			field: condition.field,
			fieldValue,
			numericValue,
			completed,
			queryResult
		});

		return { completed, progress: numericValue };
	}
}