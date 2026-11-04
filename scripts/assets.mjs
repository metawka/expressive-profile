import { readFileSync, writeFileSync, readdirSync, mkdirSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as si from "simple-icons";
import { create } from "fontkit";
import { decompress } from "wawoff2";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const symDir = join(root, "node_modules/@material-symbols/svg-400/rounded");
const src = join(root, "src/render");
const pub = join(root, "public");
mkdirSync(pub, { recursive: true });

// Fonts
const fonts = {
  FONT: readFileSync(join(root, "fonts/GoogleSansFlex-subset.woff2")).toString("base64"),
};
const chromeSources = {
  body: [
    { file: "IBMPlexSans-latin.woff2", public: "chrome-body.woff2", weight: "400 700" },
  ],
  display: [{ file: "BarlowCondensed-Bold-latin.woff2", public: "chrome-display.woff2", weight: "700" }],
  mono: [{ file: "IBMPlexMono-Medium-latin.woff2", public: "chrome-mono.woff2", weight: "500" }],
};
const chromeFonts = {};
const faces = {};
for (const [face, sources] of Object.entries(chromeSources)) {
  chromeFonts[face] = sources.map((source) => {
    const path = join(root, "fonts", source.file);
    copyFileSync(path, join(pub, source.public));
    return { data: readFileSync(path).toString("base64"), weight: source.weight };
  });
  faces[face] = [];
  // The decoder shares WASM output memory; copy each result before decoding again.
  for (const source of sources) {
    const decoded = Buffer.from(await decompress(readFileSync(join(root, "fonts", source.file))));
    faces[face].push(create(decoded));
  }
}
const chromeLicenses = ["OFL-Barlow.txt", "OFL-IBMPlex.txt"]
  .map((file) => readFileSync(join(root, "fonts", file), "utf8").split("\n").map((line) => line.trimEnd()).join("\n")).join("\n\n");
writeFileSync(
  join(src, "fontdata.ts"),
  Object.entries(fonts).map(([k, v]) => `export const ${k} = "${v}";`).join("\n") + "\n" +
    `export const CHROME_FONTS: Record<string, {data: string; weight: string}[]> = ${JSON.stringify(chromeFonts)};\n` +
    `export const CHROME_LICENSES = ${JSON.stringify(chromeLicenses)};\n`,
);
const chromeMetrics = {};
for (const [face, fonts] of Object.entries(faces)) {
  const family = [...fonts, ...faces.body];
  const codes = [...new Set(family.flatMap((font) => font.characterSet))]
    .filter((code) => family.some((font) => font.hasGlyphForCodePoint(code)));
  chromeMetrics[face] = {};
  for (const weight of [400, 500, 600, 700]) {
    const variants = family.map((font) => font.variationAxes?.wght ? font.getVariation({ wght: weight }) : font);
    chromeMetrics[face][weight] = Object.fromEntries(codes.map((code) => {
      const font = variants.find((font) => font.hasGlyphForCodePoint(code));
      return [String.fromCodePoint(code), font.glyphForCodePoint(code).advanceWidth / font.unitsPerEm];
    }));
  }
}
writeFileSync(join(src, "chrome-metrics.json"), JSON.stringify(chromeMetrics));
copyFileSync(join(root, "fonts/GoogleSansFlex-subset.woff2"), join(pub, "gsf.woff2"));

// Symbols
const symbols = {};
for (const f of readdirSync(symDir)) {
  if (!f.endsWith(".svg")) continue;
  const svg = readFileSync(join(symDir, f), "utf8");
  const ds = [...svg.matchAll(/ d="([^"]+)"/g)].map((m) => m[1]);
  const name = f.endsWith("-fill.svg") ? f.slice(0, -9) + "#fill" : f.slice(0, -4);
  symbols[name] = ds.join(" ");
}
writeFileSync(join(pub, "symbols.json"), JSON.stringify(symbols));

// Brands
const brands = {};
for (const icon of Object.values(si)) {
  if (icon && icon.slug && icon.path) brands[icon.slug] = { t: icon.title, d: icon.path, c: icon.hex };
}
writeFileSync(join(pub, "brands.json"), JSON.stringify(brands));

// Core
const coreSymbols = [
  "folder_zip", "monitoring", "music_note", "mic", "desktop_windows", "code", "language", "star",
  "fork_right", "commit", "group", "merge", "book_2", "terminal", "sports_esports", "widgets",
  "palette", "bolt", "arrow_outward", "favorite", "schedule", "download", "person", "location_on",
  "calendar_month", "deployed_code", "school", "work", "mail", "rocket_launch", "brush", "public",
  "pets", "coffee", "headphones", "photo_camera", "add", "link", "cloud", "database",
  "translate", "home", "lightbulb", "verified", "psychology", "dark_mode", "light_mode", "drag_indicator", "edit", "visibility_off", "visibility", "close", "delete", "search", "check", "restart_alt", "image", "open_in_new", "upload", "keyboard_arrow_down", "chevron_right", "shuffle", "arrow_back", "contrast", "local_fire_department", "trophy", "share", "content_copy", "wallpaper", "dashboard", "add_photo_alternate", "arrow_forward", "edit_square", "auto_awesome_mosaic", "info", "format_paint", "account_circle", "shapes", "interests", "animation", "folder_open", "progress_activity",
];
const coreBrands = [
  "rust", "dotnet", "python", "typescript", "javascript", "nextdotjs", "openjdk", "hyprland",
  "archlinux", "discord", "git", "githubactions", "react", "nodedotjs", "tauri", "electron", "github",
  "telegram", "vuedotjs", "svelte", "tailwindcss", "figma", "docker", "linux", "go", "kotlin",
  "swift", "cplusplus", "html5", "css", "vite", "postgresql", "android", "flutter", "dart", "php",
  "x", "youtube", "twitch", "spotify", "vercel", "supabase", "unity", "godotengine", "blender", "instagram", "tiktok", "vk", "bluesky", "mastodon", "reddit", "steam", "boosty", "patreon", "kofi", "buymeacoffee", "devdotto", "medium", "habr", "leetcode", "codepen", "dribbble", "behance", "threads", "pinterest", "whatsapp", "signal", "gmail", "protonmail", "linktree", "itchdotio", "artstation", "soundcloud", "yandexcloud",
];
const core = { symbol: {}, brand: {} };
for (const n of coreSymbols) {
  if (symbols[n]) core.symbol[n] = symbols[n];
  else console.warn("no symbol", n);
  if (symbols[n + "#fill"]) core.symbol[n + "#fill"] = symbols[n + "#fill"];
}
for (const n of coreBrands) if (brands[n]) core.brand[n] = brands[n]; else console.warn("no brand", n);
writeFileSync(join(src, "core-icons.json"), JSON.stringify(core));

console.log("symbols", Object.keys(symbols).length, "brands", Object.keys(brands).length);
