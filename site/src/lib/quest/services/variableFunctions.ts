const variableFunctionModules = import.meta.glob('/src/data/*/variables/*.ts');

const variableFunctionLoaders = new Map(
	Object.entries(variableFunctionModules).map(([path, loader]) => {
		const normalizedPath = path
			.replace('/src/data', '/data')
			.replace(/\.ts$/, '');
		return [normalizedPath, loader];
	})
);

export async function resolveVariableFunction(
	functionName: string,
	projectName: string
): Promise<string> {
	const variableFunctionPath = `/data/${projectName}/variables/${functionName}`;

	try {
		const loader = variableFunctionLoaders.get(variableFunctionPath);
		if (!loader) {
			console.warn(`Variable function module not found for ${variableFunctionPath}`);
			return functionName;
		}

		const module = await loader();
		const func = module[functionName];
		if (!func) {
			console.warn(`No export named ${functionName} found in ${variableFunctionPath}`);
			return functionName; // Return as-is if function not found
		}

		if (typeof func !== 'function') {
			console.warn(`Variable function ${functionName} is not a function`);
			return functionName;
		}

		return func();
	} catch (error) {
		console.error(
			`Error loading or executing variable function ${functionName} for project ${projectName}:`,
			error
		);
		return functionName; // Return as-is if anything fails
	}
}
