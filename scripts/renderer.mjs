import { build } from "esbuild";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { copyFileSync } from "node:fs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

await build({
  entryPoints: [join(root, "src/cli/render.ts")],
  outfile: join(root, "action/render.mjs"),
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  minify: true,
  legalComments: "none",
  banner: { js: "// expressive-profile-renderer" },
  logLevel: "warning",
});
copyFileSync(join(root, "action/render.mjs"), join(root, "public/profile-renderer.mjs"));
console.log("renderer ok");
