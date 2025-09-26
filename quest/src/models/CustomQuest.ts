import { BaseQuest, ValidationResult } from './BaseQuest';
import { loadCustomValidator } from '../validators/customValidators';

export class CustomQuest extends BaseQuest {
	private validatorCache: ((data: any, params?: Record<string, any>) => boolean) | null = null;

	async validate(queryResult: any): Promise<ValidationResult> {
		if (!this.config.validatorFile || !this.config.validatorFunction) {
			console.error('Custom quest requires validatorFile and validatorFunction');
			return { completed: false };
		}

		if (!this.validatorCache) {
			this.validatorCache = await loadCustomValidator(
				this.config.validatorFile,
				this.config.validatorFunction
			);
		}

		if (!this.validatorCache) {
			console.error(`Failed to load validator: ${this.config.validatorFile}#${this.config.validatorFunction}`);
			return { completed: false };
		}

		return {
			completed: this.validatorCache(queryResult, this.config.validatorParams || {})
		};
	}
}