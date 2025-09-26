import { BaseQuest, ValidationResult } from './BaseQuest';
import { loadCustomValidator } from '../validators/customValidators';

export class CustomQuest extends BaseQuest {
	private validatorCache: ((data: any, params?: Record<string, any>) => boolean) | null = null;
	private projectName: string;

	constructor(config: any, projectName: string) {
		super(config);
		this.projectName = projectName;
	}

	async validate(queryResult: any): Promise<ValidationResult> {
		if (!this.validatorCache) {
			const validatorPath = `/data/${this.projectName}/validators/${this.config.id}`;
			this.validatorCache = await loadCustomValidator(validatorPath, 'validate');
		}

		if (!this.validatorCache) {
			console.error(`Failed to load validator for quest: ${this.config.id}`);
			return { completed: false };
		}

		return {
			completed: this.validatorCache(queryResult, this.config.validatorParams || {})
		};
	}
}