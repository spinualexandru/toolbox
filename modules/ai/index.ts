import { program } from "commander";
import { handleAsk } from "./commands/ask";
import { handleChat } from "./commands/chat";

const ai = program
	.command("ai")
	.description("AI-powered tools")
	.option("--provider <provider>", "AI provider (google or ollama)")
	.option("--model <model>", "Model name to use");

ai.command("ask")
	.description("Ask a one-shot question to the AI model")
	.argument("[prompt...]", "Prompt to send to the AI model (or pipe via stdin)")
	.action(handleAsk);

ai.command("chat")
	.description("Start an interactive conversation with the AI")
	.action(handleChat);
