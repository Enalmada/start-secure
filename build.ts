const result = await Bun.build({
	entrypoints: ["./src/index.ts"],
	outdir: "./dist",
	target: "node",
	format: "esm",
	external: ["@tanstack/*"],
	minify: false,
	sourcemap: "external",
	naming: "[dir]/[name].mjs",
});

if (!result.success) {
	for (const _message of result.logs) {
	}
	process.exit(1);
}

// Also build CJS version
const cjsResult = await Bun.build({
	entrypoints: ["./src/index.ts"],
	outdir: "./dist",
	target: "node",
	format: "cjs",
	external: ["@tanstack/*"],
	minify: false,
	sourcemap: "external",
	naming: "[dir]/[name].js",
});

if (!cjsResult.success) {
	for (const _message of cjsResult.logs) {
	}
	process.exit(1);
}
