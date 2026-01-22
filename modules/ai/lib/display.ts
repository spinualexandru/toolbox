import { log } from "../../../lib/logger";
import { GOOGLE_MODELS } from "../providers/google";
import { fetchOllamaModels } from "../providers/ollama";

export async function displayModels(
	currentProvider: string,
	currentModel: string,
) {
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
