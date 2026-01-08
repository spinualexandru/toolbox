import type { Provider } from "../types";

export interface AIConfig {
	provider: Provider;
	model: string;
}

const BootConfig = (globalThis as Record<string, unknown>).toolkBootConfig as {
	modules?: Record<string, unknown>;
};

export function getConfig(): AIConfig {
	const config = BootConfig.modules?.ai as
		| { provider?: string; model?: string }
		| undefined;
	return {
		model: config?.model ?? "gemini-3-flash-preview",
		provider: (config?.provider as Provider) ?? "google",
	};
}
