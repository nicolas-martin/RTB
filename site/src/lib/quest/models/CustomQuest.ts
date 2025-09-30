import { BaseQuest } from './BaseQuest';
import type { ValidationResult } from './BaseQuest';
import { loadCustomValidator } from '../validators/customValidators';

export class CustomQuest extends BaseQuest {
	private validatorCache: ((data: any, params?: Record<string, any>) => any | Promise<any>) | null = null;
	private projectName: string;
	private typeParams: any[];

	constructor(config: any, projectName: string, typeParams: any[] = []) {
		super(config);
		this.projectName = projectName;
		this.typeParams = typeParams;
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

		// Merge typeParams into validatorParams
		const allParams = {
			...this.config.validatorParams,
			typeParams: this.typeParams
		};

		const result = await this.validatorCache(queryResult, allParams);

		// Handle different return types
		let completed: boolean;
		let progress: number | undefined;

		if (typeof result === 'boolean') {
			completed = result;
		} else if (typeof result === 'number') {
			// If typeParams has a target (first param), use it for completion check
			const target = this.typeParams[0];
			completed = typeof target === 'number' ? result >= target : false;
			progress = result;
		} else if (typeof result === 'object' && result !== null) {
			completed = result.completed || false;
			progress = result.progress;
		} else {
			completed = false;
		}

		console.log(`[CustomQuest] ${this.config.id}`, {
			questId: this.config.id,
			validatorPath: `/data/${this.projectName}/validators/${this.config.id}`,
			queryResult,
			typeParams: this.typeParams,
			result,
			completed,
			progress
		});

		return { completed, progress };
	}

	getTypeParams(): any[] {
		return [...this.typeParams];
	}
}
