#!/usr/bin/env bun
import { log } from "@lib/logger";
import Kernel from "./kernel";

import { program as commanderProgram } from "commander";
export const program = commanderProgram;

Kernel.Boot();

Kernel.Listen("modules:loaded", (data) => {
	log(`[Kernel] ${data.loaded}/${data.total} modules loaded.`, "green");
	if (data.failed > 0) {
		log(`[Kernel] ${data.failed} module(s) failed to load.`, "yellow");
	}
	log(`[Kernel] Uptime: ${Kernel.Uptime}ms`, "green");
});

await Kernel.ProbeModules();

Kernel.Process();
