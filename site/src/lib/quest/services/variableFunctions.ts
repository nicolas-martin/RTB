export async function resolveVariableFunction(functionName: string, projectName: string): Promise<string> {
	try {
		// Load individual variable function file
		const variableFunctionPath = `/data/${projectName}/variables/${functionName}`;
		const module = await import(/* @vite-ignore */ variableFunctionPath);

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
		console.error(`Error loading or executing variable function ${functionName} for project ${projectName}:`, error);
		return functionName; // Return as-is if anything fails
	}
}