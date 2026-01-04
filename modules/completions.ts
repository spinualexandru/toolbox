import { program } from "commander";

program
	.command("install-completions")
	.description("Generate shell completions")
	.action(() => {
		const commands = program.commands.map((c) => c.name()).join(" ");
		const fishScript = `complete -c toolk -f -a "${commands}"`;
		console.log(fishScript);
	});
