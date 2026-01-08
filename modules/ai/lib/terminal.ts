import { $ } from "bun";
import { marked } from "marked";
import TerminalRenderer from "marked-terminal";

// Configure marked for terminal output
marked.setOptions({
	breaks: true,
	gfm: true,
	renderer: new TerminalRenderer(),
});

export { marked };

export async function getTerminalWidth(): Promise<string> {
	try {
		return $`tput cols`.toString().trim();
	} catch {
		return "80";
	}
}

export function getSystemPrompt(cols: string): string {
	return `
You are a helpful assistant running in a terminal.
Provide concise and clear responses suitable for terminal display.
The terminal in which you run supports nerd fonts and 24-bit colors. Use these features where appropriate to enhance readability.
Columns width of the terminal is ${cols} characters.
Render tables and code blocks properly to fit within the terminal width.
`.trimStart();
}
