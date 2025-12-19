import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { cancel, intro, isCancel, outro, spinner, text } from "@clack/prompts";
import { log } from "@lib/logger";
import { readStdin } from "@lib/stdin";
import { generateText } from "ai";
import { $ } from "bun";
import { program } from "commander";
import { marked } from "marked";
import TerminalRenderer from "marked-terminal";
import { createOllama } from "ollama-ai-provider-v2";
import BootConfig from "../boot.yaml";

// Suppress AI SDK warnings
(globalThis as { AI_SDK_LOG_WARNINGS?: boolean }).AI_SDK_LOG_WARNINGS = false;

marked.setOptions({
	breaks: true,
	gfm: true,
	renderer: new TerminalRenderer(),
});

interface AIConfig {
	provider: "google" | "ollama";
	model: string;
}

function getConfig(): AIConfig {
	const config = BootConfig.modules?.ai as
		| { provider?: string; model?: string }
		| undefined;
	return {
		model: config?.model ?? "gemini-3-flash-preview",
		provider: (config?.provider as AIConfig["provider"]) ?? "google",
	};
}

interface Message {
	role: "user" | "assistant";
	content: string;
}

function createModel(provider: string, modelName: string) {
	if (provider === "ollama") {
		const ollama = createOllama({ baseURL: "http://localhost:11434/api" });
		return ollama(modelName);
	}

	// Default: Google
	const apiKey = process.env.GOOGLE_API_KEY;
	if (!apiKey) {
		log("Error: GOOGLE_API_KEY environment variable is not set.", "red");
		process.exit(1);
	}
	const google = createGoogleGenerativeAI({ apiKey });
	return google(modelName);
}

async function getTerminalWidth(): Promise<string> {
	try {
		return $`tput cols`.toString().trim();
	} catch {
		return "80";
	}
}

function getSystemPrompt(cols: string): string {
	return `
You are a helpful assistant running in a terminal.
Provide concise and clear responses suitable for terminal display.
The terminal in which you run supports nerd fonts and 24-bit colors. Use these features where appropriate to enhance readability.
Columns width of the terminal is ${cols} characters.
Render tables and code blocks properly to fit within the terminal width.
`.trimStart();
}

const GOOGLE_MODELS = [
	"gemini-3-pro-preview",
	"gemini-3-flash-preview",
	"gemini-2.5-flash",
	"gemini-2.5-flash-lite-preview-09-2025",
	"gemini-2.5-flash-preview-09-2025",
	"gemini-flash-latest",
];

async function fetchOllamaModels(): Promise<string[]> {
	try {
		const response = await fetch("http://localhost:11434/api/tags");
		const data = (await response.json()) as {
			models?: { name: string }[];
		};
		return data.models?.map((m) => m.name) ?? [];
	} catch {
		return [];
	}
}

async function displayModels(currentProvider: string, currentModel: string) {
	console.log("\n Available Models:\n");

	console.log("  Google:");
	for (const modelName of GOOGLE_MODELS) {
		const active = currentProvider === "google" && currentModel === modelName;
		const prefix = active ? "  → " : "    ";
		const suffix = active ? " (active)" : "";
		log(`${prefix}${modelName}${suffix}`, active ? "green" : "white");
	}

	console.log("\n  Ollama:");
	const ollamaModels = await fetchOllamaModels();
	if (ollamaModels.length === 0) {
		log("    (not available - is Ollama running?)", "gray");
	} else {
		for (const modelName of ollamaModels) {
			const active = currentProvider === "ollama" && currentModel === modelName;
			const prefix = active ? "  → " : "    ";
			const suffix = active ? " (active)" : "";
			log(`${prefix}${modelName}${suffix}`, active ? "green" : "white");
		}
	}

	console.log("\n  Usage: /model google:<name> or /model ollama:<name>\n");
}

const tools = program
	.command("ai")
	.description("AI-powered tools")
	.option("--provider <provider>", "AI provider (google or ollama)")
	.option("--model <model>", "Model name to use");

tools
	.command("ask")
	.description("Ask a one-shot question to the AI model")
	.argument("[prompt...]", "Prompt to send to the AI model (or pipe via stdin)")
	.action(
		async (prompt: string[] = [], _options: unknown, command: unknown) => {
			const parentOpts =
				(
					command as {
						parent?: { opts: () => { provider?: string; model?: string } };
					}
				).parent?.opts() ?? {};
			const config = getConfig();
			const provider = parentOpts.provider ?? config.provider;
			const modelName = parentOpts.model ?? config.model;
			const model = createModel(provider, modelName);

			try {
				const promptText = prompt.length ? prompt.join(" ") : await readStdin();
				if (!promptText) {
					log("Error: No prompt provided.", "red");
					process.exit(1);
				}
				const cols = await getTerminalWidth();

				const { text: responseText } = await generateText({
					model,
					prompt: promptText,
					system: getSystemPrompt(cols),
				});
				console.log(marked(responseText));
			} catch (error) {
				if (error instanceof Error) {
					log(`Error: ${error.message}`, "red");
				} else {
					log("An unexpected error occurred.", "red");
				}
				process.exit(1);
			}
		},
	);

tools
	.command("chat")
	.description("Start an interactive conversation with the AI")
	.action(async (_options: unknown, command: unknown) => {
		const parentOpts =
			(
				command as {
					parent?: { opts: () => { provider?: string; model?: string } };
				}
			).parent?.opts() ?? {};
		const config = getConfig();
		let provider = parentOpts.provider ?? config.provider;
		let currentModelName = parentOpts.model ?? config.model;
		let model = createModel(provider, currentModelName);
		const cols = await getTerminalWidth();
		const systemPrompt = getSystemPrompt(cols);
		const messages: Message[] = [];

		intro("AI Chat - Interactive Mode");
		log(
			"Type 'exit' or 'quit' to end. Use '/model' to see available models.",
			"gray",
		);

		while (true) {
			const userInput = await text({
				message: "You:",
				placeholder: "Type your message...",
				validate(value) {
					if (value.length === 0) return "Please enter a message";
				},
			});

			if (isCancel(userInput)) {
				cancel("Chat ended.");
				process.exit(0);
			}

			const input = userInput.trim().toLowerCase();
			if (input === "exit" || input === "quit") {
				outro("Goodbye!");
				break;
			}

			// Handle /model command
			if (input.startsWith("/model")) {
				const arg = userInput.trim().slice(6).trim();

				if (!arg) {
					await displayModels(provider, currentModelName);
				} else {
					const [newProvider, ...modelParts] = arg.split(":");
					const newModelName = modelParts.join(":");

					if (
						(newProvider === "google" || newProvider === "ollama") &&
						newModelName
					) {
						provider = newProvider;
						currentModelName = newModelName;
						model = createModel(provider, currentModelName);
						log(`Switched to ${provider}:${currentModelName}`, "green");
					} else {
						log(
							"Invalid format. Use: /model google:<name> or /model ollama:<name>",
							"red",
						);
					}
				}
				continue;
			}

			messages.push({
				content: userInput,
				role: "user",
			});

			const s = spinner();
			s.start("Thinking...");

			try {
				const { text: responseText } = await generateText({
					messages: messages.map((msg) => ({
						content: msg.content,
						role: msg.role,
					})),
					model,
					system: systemPrompt,
				});

				s.stop("Response received");

				messages.push({
					content: responseText,
					role: "assistant",
				});

				console.log(`\n${marked(responseText)}`);
			} catch (error) {
				s.stop("Error occurred");

				if (error instanceof Error) {
					log(`Error: ${error.message}`, "red");
				} else {
					log("An unexpected error occurred.", "red");
				}

				messages.pop();
				log("Please try again.", "yellow");
			}
		}
	});
