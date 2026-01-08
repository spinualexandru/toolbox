import { createOllama } from "ollama-ai-provider-v2";

const OLLAMA_BASE_URL = "http://localhost:11434/api";

export function createOllamaModel(modelName: string) {
	const ollama = createOllama({ baseURL: OLLAMA_BASE_URL });
	return ollama(modelName);
}

export async function fetchOllamaModels(): Promise<string[]> {
	try {
		const response = await fetch(`${OLLAMA_BASE_URL}/tags`);
		const data = (await response.json()) as {
			models?: { name: string }[];
		};
		return data.models?.map((m) => m.name) ?? [];
	} catch {
		return [];
	}
}
