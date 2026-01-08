import { cancel, intro, isCancel, outro, spinner, text } from "@clack/prompts";
import { log } from "@lib/logger";
import { generateText } from "ai";
import { getConfig } from "../lib/config";
import { displayModels } from "../lib/display";
import { getSystemPrompt, getTerminalWidth, marked } from "../lib/terminal";
import { createModel } from "../providers/factory";
import type { Message, Provider } from "../types";

export async function handleChat(_options: unknown, command: unknown) {
	const parentOpts =
		(
			command as {
				parent?: { opts: () => { provider?: string; model?: string } };
			}
		).parent?.opts() ?? {};

	const config = getConfig();
	let provider: Provider = parentOpts.provider ?? config.provider;
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
}
