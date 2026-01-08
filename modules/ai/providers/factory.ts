import type { Provider } from "../types";
import { createGoogleModel } from "./google";
import { createOllamaModel } from "./ollama";

// Suppress AI SDK warnings
(globalThis as { AI_SDK_LOG_WARNINGS?: boolean }).AI_SDK_LOG_WARNINGS = false;

export function createModel(provider: Provider, modelName: string) {
	switch (provider) {
		case "ollama":
			return createOllamaModel(modelName);
		default:
			return createGoogleModel(modelName);
	}
}
