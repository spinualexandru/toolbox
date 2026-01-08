import { log } from "@lib/logger";
import { readStdin } from "@lib/stdin";
import { generateText } from "ai";
import { getConfig } from "../lib/config";
import { getSystemPrompt, getTerminalWidth, marked } from "../lib/terminal";
import { createModel } from "../providers/factory";

export async function handleAsk(
	prompt: string[] = [],
	_options: unknown,
	command: unknown,
) {
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
}
