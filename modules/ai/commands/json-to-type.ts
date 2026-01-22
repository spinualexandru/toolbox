import { log } from "../../../lib/logger";
import { readStdin } from "../../../lib/stdin";
import { generateText } from "ai";
import { getConfig } from "../lib/config";
import { createModel } from "../providers/factory";
import type { Provider } from "../types";

const SYSTEM_PROMPT = `You are a TypeScript type generator. Your task is to convert JSON data into TypeScript type definitions.

Rules:
- Output ONLY the TypeScript type definitions, no explanations or markdown
- Use 'interface' for object types when possible
- Use descriptive names based on the data structure
- Handle arrays, nested objects, and primitive types correctly
- For the root type, name it 'Root' unless the structure suggests a better name
- Use union types for arrays with mixed types
- Mark optional fields with '?' if they appear to be nullable`;

export async function handleJsonToType(
	jsonInput: string[] = [],
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
	const provider = (parentOpts.provider as Provider) ?? config.provider;
	const modelName = parentOpts.model ?? config.model;
	const model = createModel(provider, modelName);

	try {
		const jsonText = jsonInput.length ? jsonInput.join(" ") : await readStdin();
		if (!jsonText) {
			log("Error: No JSON provided.", "red");
			process.exit(1);
		}

		// Validate it's valid JSON
		try {
			JSON.parse(jsonText);
		} catch {
			log("Error: Invalid JSON provided.", "red");
			process.exit(1);
		}

		const { text: responseText } = await generateText({
			model,
			prompt: `Convert this JSON to TypeScript types:\n\n${jsonText}`,
			system: SYSTEM_PROMPT,
		});

		console.log(responseText);
	} catch (error) {
		if (error instanceof Error) {
			log(`Error: ${error.message}`, "red");
		} else {
			log("An unexpected error occurred.", "red");
		}
		process.exit(1);
	}
}
