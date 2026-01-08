import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { log } from "@lib/logger";

export const GOOGLE_MODELS = [
	"gemini-3-pro-preview",
	"gemini-3-flash-preview",
	"gemini-2.5-flash",
	"gemini-2.5-flash-lite-preview-09-2025",
	"gemini-2.5-flash-preview-09-2025",
	"gemini-flash-latest",
] as const;

export function createGoogleModel(modelName: string) {
	const apiKey = process.env.GOOGLE_API_KEY;
	if (!apiKey) {
		log("Error: GOOGLE_API_KEY environment variable is not set.", "red");
		process.exit(1);
	}
	const google = createGoogleGenerativeAI({ apiKey });
	return google(modelName);
}
