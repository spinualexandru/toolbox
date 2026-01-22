import type { CompileBuildConfig } from "bun";

await Bun.build({
	bytecode: true,
	compile: true,
	entrypoints: ["./index.ts"],
	minify: true,
	outdir: "./build/toolbox",
	sourcemap: "inline",
	target: "bun",
	tsconfig: "./tsconfig.json",
} as CompileBuildConfig);
