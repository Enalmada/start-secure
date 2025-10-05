const result = await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  target: 'node',
  format: 'esm',
  external: ['@tanstack/*'],
  minify: false,
  sourcemap: 'external',
  naming: '[dir]/[name].mjs',
});

if (!result.success) {
  console.error('Build failed');
  for (const message of result.logs) {
    console.error(message);
  }
  process.exit(1);
}

// Also build CJS version
const cjsResult = await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  target: 'node',
  format: 'cjs',
  external: ['@tanstack/*'],
  minify: false,
  sourcemap: 'external',
  naming: '[dir]/[name].js',
});

if (!cjsResult.success) {
  console.error('CJS Build failed');
  for (const message of cjsResult.logs) {
    console.error(message);
  }
  process.exit(1);
}

console.log('Build successful');
