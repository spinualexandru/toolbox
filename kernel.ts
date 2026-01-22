import type { PathLike } from "bun";
import { program } from "commander";
import pkg from "./package.json";

interface ModuleState {
	id: string;
	path: PathLike;
	loaded: boolean;
	error?: string;
	config: ModuleConfig;
	source: "builtin" | "user";
}

interface ModuleConfig {
	enabled: boolean;
}

interface BootConfig {
	modules: Record<string, ModuleConfig>;
}

interface KernelEvents {
	"modules:loaded": { total: number; loaded: number; failed: number };
}

type EventCallback<T> = (data: T) => void;

class Kernel {
	readonly _VERSION = pkg.version;
	readonly _BOOT_TIME = new Date();
	private modules = new Map<string, ModuleState>();
	private eventBus = new Map<string, EventCallback<unknown>[]>();
	private bootConfig: BootConfig = { modules: {} };

	public Boot() {
		program
			.name("toolk")
			.description("A modular CLI toolkit")
			.version(pkg.version);
	}

	// Mark a module as statically loaded (for bundled builds)
	public MarkAsLoaded(name: string): void {
		this.modules.set(name, {
			config: { enabled: true },
			id: name,
			loaded: true,
			path: `./modules/${name}`,
			source: "builtin",
		});
	}

	private GetConfigDir(): string {
		const xdgConfigHome = process.env.XDG_CONFIG_HOME;
		const homeDir = process.env.HOME ?? "";
		const configBase = xdgConfigHome ?? `${homeDir}/.config`;
		return `${configBase}/toolk`;
	}

	private GetUserModulesDir(): string {
		return `${this.GetConfigDir()}/modules`;
	}

	private async LoadBootConfig(): Promise<void> {
		const configPath = `${this.GetConfigDir()}/boot.yaml`;
		try {
			const config = await import(configPath);
			this.bootConfig = config.default as BootConfig;
		} catch {
			// Config doesn't exist or isn't readable - use defaults
			this.bootConfig = { modules: {} };
		}
	}

	private async DiscoverUserModules(): Promise<Map<string, string>> {
		const userModules = new Map<string, string>();
		const userModulesDir = this.GetUserModulesDir();

		try {
			const glob = new Bun.Glob("*.ts");
			const indexGlob = new Bun.Glob("*/index.ts");

			// Pattern 1: Direct file modules (e.g., file.ts)
			for await (const file of glob.scan({
				absolute: true,
				cwd: userModulesDir,
			})) {
				const name = file.split("/").pop()?.replace(/\.ts$/, "");
				if (name && name !== "index") {
					userModules.set(name, file);
				}
			}

			// Pattern 2: Directory modules (e.g., example/index.ts)
			for await (const file of indexGlob.scan({
				absolute: true,
				cwd: userModulesDir,
			})) {
				const parts = file.split("/");
				const name = parts[parts.length - 2];
				if (name) {
					userModules.set(name, file);
				}
			}
		} catch {
			// Directory doesn't exist or isn't readable - silently ignore
		}

		return userModules;
	}

	protected async RegisterUserModule(
		name: string,
		absolutePath: string,
	): Promise<boolean> {
		this.modules.set(name, {
			config: { enabled: true },
			id: name,
			loaded: false,
			path: absolutePath,
			source: "user",
		});

		try {
			await import(absolutePath);
			const moduleState = this.modules.get(name);
			if (moduleState) {
				moduleState.loaded = true;
			}
			return true;
		} catch (error) {
			const moduleState = this.modules.get(name);
			if (moduleState) {
				moduleState.error =
					error instanceof Error ? error.message : String(error);
			}
			console.error(
				`Failed to load user module "${name}": ${error instanceof Error ? error.message : error}`,
			);
			return false;
		}
	}

	protected async RegisterModule(
		name: string,
		config: ModuleConfig,
	): Promise<boolean> {
		// Skip if already loaded via static import
		const existing = this.modules.get(name);
		if (existing?.loaded) {
			return true;
		}

		const modulePath = `./modules/${name}`;
		this.modules.set(name, {
			config,
			id: name,
			loaded: false,
			path: modulePath,
			source: "builtin",
		});

		try {
			await import(modulePath);
			const moduleState = this.modules.get(name);
			if (moduleState) {
				moduleState.loaded = true;
			}
			return true;
		} catch (error) {
			const moduleState = this.modules.get(name);
			if (moduleState) {
				moduleState.error =
					error instanceof Error ? error.message : String(error);
			}
			console.error(
				`Failed to load module "${name}": ${error instanceof Error ? error.message : error}`,
			);
			return false;
		}
	}

	async ProbeUserModules(): Promise<void> {
		const userModules = await this.DiscoverUserModules();

		// Expose program globally for user modules
		(globalThis as Record<string, unknown>).toolkProgram = program;

		for (const [name, absolutePath] of userModules) {
			if (this.modules.has(name)) {
				const existingModule = this.modules.get(name);
				console.error(
					`Error: User module "${name}" conflicts with built-in module.`,
				);
				console.error(`  Built-in: ${existingModule?.path}`);
				console.error(`  User:     ${absolutePath}`);
				console.error(`  Refusing to load user module. Please rename it.`);
				continue;
			}

			await this.RegisterUserModule(name, absolutePath);
		}
	}

	async ProbeModules() {
		await this.LoadBootConfig();

		// Expose boot config globally for modules
		(globalThis as Record<string, unknown>).toolkBootConfig = this.bootConfig;

		for (const [name, config] of Object.entries(
			this.bootConfig.modules ?? {},
		) as [string, ModuleConfig][]) {
			if (config?.enabled !== false) {
				// Default to enabled
				await this.RegisterModule(name, config);
			}
		}

		await this.ProbeUserModules();

		const modules = Array.from(this.modules.values());
		const loaded = modules.filter((m) => m.loaded).length;
		const failed = modules.filter((m) => m.error).length;

		this.Emit("modules:loaded", {
			failed,
			loaded,
			total: this.modules.size,
		});
	}

	public GetModules() {
		return Array.from(this.modules.values());
	}

	public Process() {
		program.parse();
	}

	public Listen<K extends keyof KernelEvents>(
		event: K,
		callback: EventCallback<KernelEvents[K]>,
	) {
		if (!this.eventBus.has(event)) {
			this.eventBus.set(event, []);
		}
		this.eventBus.get(event)?.push(callback as EventCallback<unknown>);
	}

	public Emit<K extends keyof KernelEvents>(event: K, data: KernelEvents[K]) {
		this.eventBus.get(event)?.forEach((callback) => {
			callback(data);
		});
	}

	get Uptime() {
		return Date.now() - this._BOOT_TIME.getTime();
	}

	get DidModulesLoad() {
		return (
			Array.from(this.modules.values()).filter((m) => m.loaded).length ===
			this.modules.size
		);
	}
}

const kernel = new Kernel();
export default kernel;
export { program };
