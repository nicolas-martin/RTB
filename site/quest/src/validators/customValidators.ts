export type CustomValidator = (data: any, params?: Record<string, any>) => boolean;

export async function loadCustomValidator(
	filePath: string,
	functionName: string
): Promise<CustomValidator | null> {
	try {
		const module = await import(/* @vite-ignore */ filePath);
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
