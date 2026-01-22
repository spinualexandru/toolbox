import { withTemplate } from "../../../lib/template";
import { getToolFilePath, validateToolName } from "../lib/validation";

export async function handleFrom(
	scriptPath: string,
	options: { name?: string },
) {
	validateToolName(options.name);

	const filePath = getToolFilePath(
		import.meta.dir.replace("/commands", ""),
		options.name as string,
	);

	try {
		const scriptContent = await Bun.file(scriptPath).text();
		const template = await withTemplate("toolk-from", {
			name: options.name!,
			scriptContent,
		});
		await Bun.write(filePath, template);
	} catch (error) {
		console.error(`${error instanceof Error ? error.message : ""}`);
		process.exit(1);
	}
}
