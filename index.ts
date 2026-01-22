#!/usr/bin/env bun
import { log } from "@lib/logger";
import { program as commanderProgram } from "commander";
import Kernel from "./kernel";

// Static imports to ensure built-in modules are bundled
import "./modules/ai";
import "./modules/toolk";
import "ai";
export const program = commanderProgram;

Kernel.Boot();

// Mark statically imported modules as loaded
Kernel.MarkAsLoaded("ai");
Kernel.MarkAsLoaded("toolk");

Kernel.Listen("modules:loaded", (data) => {
	log(`[Kernel] ${data.loaded}/${data.total} modules loaded.`, "green");
	if (data.failed > 0) {
		log(`[Kernel] ${data.failed} module(s) failed to load.`, "yellow");
	}
	log(`[Kernel] Uptime: ${Kernel.Uptime}ms`, "green");
});

Kernel.ProbeModules().then(() => {
	Kernel.Process();
});
