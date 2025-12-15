import { withTemplate } from "@lib/template";
import { $ } from "bun";
import { program } from "commander";

program
	.command("edit")
	.description("Opens the toolbox in the editor")
	.action(async () => {
		try {
			await $`zeditor ~/Experiments/toolbox-cli`;
		} catch (error) {
			console.error(`${error instanceof Error ? error.message : ""}`);
			process.exit(1);
		}
	});

const tools = program.command("tool");

tools
	.command("add")
	.description("Add a new tool to the toolbox")
	.argument("<name>", "Name of the new tool")
	.action(async (name: string) => {
		if (!name || !/^[a-z][a-z0-9-]*$/i.test(name)) {
			console.error("Invalid tool name.");
			process.exit(1);
		}

		const filePath = `${import.meta.dir}/${name}.ts`;
		const template = await withTemplate("toolbox-from", {
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
	});

tools
	.command("from")
	.description("Create a new tool from a Bash script")
	.argument("<scriptPath>", "Path to the Bash script")
	.option("--name <name>", "-n", "Name of the new tool")
	.action(async (scriptPath: string, options: { name?: string }) => {
		if (!options.name || !/^[a-z][a-z0-9-]*$/i.test(options.name)) {
			console.error("Invalid tool name.");
			process.exit(1);
		}

		const filePath = `${import.meta.dir}/${options.name}.ts`;

		try {
			const scriptContent = await Bun.file(scriptPath).text();
			const template = await withTemplate("toolbox-from", {
				name: options.name,
				scriptContent,
			});
			await Bun.write(filePath, template);
		} catch (error) {
			console.error(`${error instanceof Error ? error.message : ""}`);
			process.exit(1);
		}
	});
