await Bun.build({
	entrypoints: ["./index.ts"],
	minify: true,
	outdir: "./build",
	sourcemap: "inline",
	target: "bun",
});
