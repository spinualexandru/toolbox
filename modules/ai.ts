import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { log } from "@lib/logger";
import { readStdin } from "@lib/stdin";
import { generateText } from "ai";
import { program } from "commander";
import { marked } from "marked";
import TerminalRenderer from "marked-terminal";

marked.setOptions({
	breaks: true,
	gfm: true,
	renderer: new TerminalRenderer(),
});

const apiKey = process.env.GOOGLE_API_KEY;

const tools = program.command("ai").description("AI-powered tools");

tools
	.command("chat")
	.description("Ask questions to the AI model")
	.argument("[prompt...]", "Prompt to send to the AI model (or pipe via stdin)")
	.action(async (prompt: string[] = []) => {
		if (!apiKey) {
			log("Error: GOOGLE_API_KEY environment variable is not set.", "red");
			process.exit(1);
		}

		const google = createGoogleGenerativeAI({ apiKey });
		const model = google("gemini-flash-latest");

		try {
			const promptText = prompt.length ? prompt.join(" ") : await readStdin();
			if (!promptText) {
				log("Error: No prompt provided.", "red");
				process.exit(1);
			}

			const { text } = await generateText({
				model,
				prompt: promptText,
				system: `
					You are a helpful assistant running in a terminal.
					Provide concise and clear responses suitable for terminal display, can be markdown.`.trimStart(),
			});
			console.log(marked(text));
		} catch (error) {
			if (error instanceof Error) {
				log(`Error: ${error.message}`, "red");
			} else {
				log("An unexpected error occurred.", "red");
			}
			process.exit(1);
		}
	});
