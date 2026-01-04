import { $ } from "bun";

const program = (globalThis as Record<string, unknown>).toolboxProgram as typeof import("commander").program;

program
	.command("brightness")
	.description("Set the screen brightness to a specified level (0-600)")
	.argument("<level>", "Brightness level (0-600)")
	.action(async (level: string) => {
		const numLevel = Number.parseInt(level, 10);
		if (Number.isNaN(numLevel) || numLevel < 0 || numLevel > 600) {
			console.error(
				"Error: Brightness level must be a number between 0 and 600.",
			);
			process.exit(1);
		}

		try {
			await $`brightnessctl --device='intel_backlight' set ${numLevel}`.quiet();
		} catch (error) {
			console.error(
				`Error: Failed to set brightness. ${error instanceof Error ? error.message : ""}`,
			);
			process.exit(1);
		}
	});
