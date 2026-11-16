import { build } from "esbuild";

await build({
  entryPoints: [new URL("./src/index.mjs", import.meta.url).pathname],
  outfile: new URL("./dist/index.mjs", import.meta.url).pathname,
  bundle: true,
  platform: "node",
  target: "node24",
  format: "esm",
  // Bundled SDK dependencies include CommonJS helpers.
  banner: { js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);' },
});
