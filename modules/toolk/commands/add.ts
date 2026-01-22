import { withTemplate } from "../../../lib/template";
import { $ } from "bun";
import { getToolFilePath, validateToolName } from "../lib/validation";

export async function handleAdd(name: string) {
	validateToolName(name);

	const filePath = getToolFilePath(
		import.meta.dir.replace("/commands", ""),
		name,
	);
	const template = await withTemplate("toolk-from", {
		name,
		scriptContent: "echo 'Hello, World!';",
	});

	try {
		await Bun.write(filePath, template);
		await $`biome format ${filePath} --write`.quiet();
	} catch (error) {
		console.error(`${error instanceof Error ? error.message : ""}`);
		process.exit(1);
	}

	console.log(`Tool ${name} added successfully at ${filePath}`);
}
