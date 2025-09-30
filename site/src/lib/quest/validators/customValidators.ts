export type CustomValidator = (data: any, params?: Record<string, any>) => boolean;

const validatorModules = import.meta.glob('/src/data/*/validators/*.ts');

const validatorLoaders = new Map(
	Object.entries(validatorModules).map(([path, loader]) => {
		const normalizedPath = path
			.replace('/src/data', '/data')
			.replace(/\.ts$/, '');
		return [normalizedPath, loader];
	})
);

export async function loadCustomValidator(
	filePath: string,
	functionName: string
): Promise<CustomValidator | null> {
	try {
		const loader = validatorLoaders.get(filePath);
		if (!loader) {
			console.error(`Validator module not found for path ${filePath}`);
			return null;
		}

		const module = await loader();
		const validator = module[functionName];

		if (typeof validator !== 'function') {
			console.error(`Function ${functionName} not found in ${filePath}`);
			return null;
		}

		return validator as CustomValidator;
	} catch (error) {
		console.error(`Failed to load validator from ${filePath}:`, error);
		return null;
	}
}
