import { writeFile } from "node:fs/promises";
import { parse } from "yaml";

const source = "https://raw.githubusercontent.com/github-linguist/linguist/master/lib/linguist/languages.yml";
const response = await fetch(source);
if (!response.ok) throw new Error(`Unable to download GitHub Linguist metadata: ${response.status}`);

const languages = parse(await response.text());
const extensions = new Map();
const filenames = new Map();
const nonCodeExtensions = new Set();
const nonCodeFilenames = new Set();

for (const definition of Object.values(languages)) {
  // Prefer prose for ambiguous suffixes such as .md. Data formats that do not
  // also identify code are already omitted by the programming/markup filter;
  // blocking every data collision would incorrectly remove TypeScript's .ts.
  if (!definition || definition.type !== "prose") continue;
  for (const extension of definition.extensions ?? []) nonCodeExtensions.add(extension.toLowerCase());
  for (const filename of definition.filenames ?? []) nonCodeFilenames.add(filename.toLowerCase());
}

for (const [name, definition] of Object.entries(languages)) {
  if (!definition || !["programming", "markup"].includes(definition.type)) continue;
  const label = definition.group ?? name;
  for (const [index, extension] of (definition.extensions ?? []).entries()) {
    const key = extension.toLowerCase();
    if (nonCodeExtensions.has(key)) continue;
    const previous = extensions.get(key);
    if (!previous || (index === 0 && previous.priority > 0)) extensions.set(key, { language: label, priority: index });
  }
  for (const filename of definition.filenames ?? []) {
    const key = filename.toLowerCase();
    if (nonCodeFilenames.has(key)) continue;
    if (!filenames.has(key)) filenames.set(key, label);
  }
}

const sorted = (entries) => Object.fromEntries([...entries].sort(([a], [b]) => a.localeCompare(b)));
const output = {
  source,
  extensions: sorted([...extensions].map(([key, value]) => [key, value.language])),
  filenames: sorted(filenames),
};

await writeFile(new URL("../src/analytics/linguist.json", import.meta.url), `${JSON.stringify(output)}\n`);
console.log(`Generated ${extensions.size} extensions and ${filenames.size} filenames from GitHub Linguist.`);
