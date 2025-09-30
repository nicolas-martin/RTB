import { QuestConfig, QuestCondition } from '../types/quest';

export type ValidationResult = {
	completed: boolean;
	progress?: number;
};

export abstract class BaseQuest {
	protected config: QuestConfig;

	constructor(config: QuestConfig) {
		this.config = config;
	}

	abstract validate(queryResult: any): ValidationResult | Promise<ValidationResult>;

	getConfig(): QuestConfig {
		return this.config;
	}

	getId(): string {
		return this.config.id;
	}

	getTitle(): string {
		return this.config.title;
	}

	getDescription(): string {
		return this.config.description;
	}

	getReward(): number {
		return this.config.reward;
	}

	getType(): string {
		return this.config.type;
	}

	getQuery(): string {
		return this.config.query;
	}

	protected resolveFieldValue(obj: any, field: string): any {
		const lenMatch = field.match(/^len\((.+)\)$/);
		if (lenMatch) {
			const value = this.getNestedValue(obj, lenMatch[1]);
			return Array.isArray(value) ? value.length : 0;
		}
		return this.getNestedValue(obj, field);
	}

	protected getNestedValue(obj: any, path: string): any {
		// Handle both dot notation and array indices
		// Convert "user.tokenVolumes[0].totalVolume" to ["user", "tokenVolumes", "0", "totalVolume"]
		const keys = path.split(/[.\[\]]+/).filter(key => key !== '');

		return keys.reduce((current, key) => {
			if (current == null) return undefined;

			// Try to parse as array index
			const numKey = parseInt(key, 10);
			if (!isNaN(numKey) && Array.isArray(current)) {
				return current[numKey];
			}

			// Regular object property access
			return current[key];
		}, obj);
	}

	protected evaluateCondition(condition: QuestCondition, value: any): boolean {
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
}
