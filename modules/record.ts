import { $ } from "bun";
import { program } from "commander";

program
	.command("record")
	.description("Record a screen region using wf-recorder")
	.action(async () => {
		const homeDir = process.env.HOME;
		const outputDir = `${homeDir}/Videos/Recordings`;

		// Generate timestamp: YYYY-MM-DD_HH-MM-SS
		const now = new Date();
		const timestamp = now
			.toISOString()
			.replace(/T/, "_")
			.replace(/:/g, "-")
			.slice(0, 19);

		const filename = `recording-${timestamp}.mp4`;
		const outputPath = `${outputDir}/${filename}`;

		// Ensure output directory exists
		await $`mkdir -p ${outputDir}`;

		// Run wf-recorder with slurp for region selection
		await $`wf-recorder -g "$(slurp)" --file=${outputPath}`;
	});
