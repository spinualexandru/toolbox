export interface Message {
	role: "user" | "assistant";
	content: string;
}

export type Provider = "google" | "ollama";
