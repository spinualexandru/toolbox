import { program } from "commander";
import { $ } from "bun";

const ollamaTool = program
	.command("ollama")
	.description("Ollama AI-powered tools");

ollamaTool
	.command("on")
	.description("Start the Ollama local server")
	.action(async () => {
		try {
			await $`sudo systemctl start ollama`;
			console.log("Ollama server started successfully.");
		} catch (error) {
			console.error("Failed to start Ollama server:", error);
		}
	});

ollamaTool
	.command("off")
	.description("Stop the Ollama local server")
	.action(async () => {
		try {
			await $`sudo systemctl stop ollama`;
			console.log("Ollama server stopped successfully.");
		} catch (error) {
			console.error("Failed to stop Ollama server:", error);
		}
	});
