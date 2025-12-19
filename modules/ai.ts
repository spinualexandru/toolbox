import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { cancel, intro, isCancel, outro, spinner, text } from "@clack/prompts";
import { log } from "@lib/logger";
import { readStdin } from "@lib/stdin";
import { generateText } from "ai";
import { $ } from "bun";
import { program } from "commander";
import { marked } from "marked";
import TerminalRenderer from "marked-terminal";

marked.setOptions({
	breaks: true,
	gfm: true,
	renderer: new TerminalRenderer(),
});

const apiKey = process.env.GOOGLE_API_KEY;

interface Message {
	role: "user" | "assistant";
	content: string;
}

function createModel() {
	if (!apiKey) {
		log("Error: GOOGLE_API_KEY environment variable is not set.", "red");
		process.exit(1);
	}
	const google = createGoogleGenerativeAI({ apiKey });
	return google("gemini-3-flash-preview");
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

const tools = program.command("ai").description("AI-powered tools");

tools
	.command("ask")
	.description("Ask a one-shot question to the AI model")
	.argument("[prompt...]", "Prompt to send to the AI model (or pipe via stdin)")
	.action(async (prompt: string[] = []) => {
		const model = createModel();

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
	});

tools
	.command("chat")
	.description("Start an interactive conversation with the AI")
	.action(async () => {
		const model = createModel();
		const cols = await getTerminalWidth();
		const systemPrompt = getSystemPrompt(cols);
		const messages: Message[] = [];

		intro("AI Chat - Interactive Mode");
		log("Type 'exit' or 'quit' to end the conversation.", "gray");

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
