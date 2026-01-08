const TOOL_NAME_PATTERN = /^[a-z][a-z0-9-]*$/i;

export function validateToolName(name: string | undefined): void {
	if (!name || !TOOL_NAME_PATTERN.test(name)) {
		console.error("Invalid tool name.");
		process.exit(1);
	}
}

export function getToolFilePath(modulesDir: string, name: string): string {
	return `${modulesDir}/${name}.ts`;
}
