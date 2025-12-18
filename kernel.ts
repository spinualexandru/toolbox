import type { PathLike } from "bun";
import { program } from "commander";
import BootConfig from "./boot.yaml";
import pkg from "./package.json";

interface ModuleState {
	id: string;
	path: PathLike;
	loaded: boolean;
	error?: string;
	config: ModuleConfig;
}

interface ModuleConfig {
	enabled: boolean;
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

	public Boot() {
		program
			.name("toolbox")
			.description("A CLI toolbox for various utilities")
			.version(pkg.version);
	}

	protected async RegisterModule(
		name: string,
		config: ModuleConfig,
	): Promise<boolean> {
		const modulePath = `./modules/${name}`;
		this.modules.set(name, {
			config,
			id: name,
			loaded: false,
			path: modulePath,
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

	async ProbeModules() {
		for (const [name, config] of Object.entries(BootConfig.modules) as [
			string,
			ModuleConfig,
		][]) {
			if (config?.enabled !== false) {
				// Default to enabled
				await this.RegisterModule(name, config);
			}
		}
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

export default new Kernel();
