import type { BlockId, Config } from "../render";

const ALL: BlockId[] = ["hero", "socials", "about", "stack", "projects", "stats", "authoredStats", "streak", "wave", "buttons"];

export const PRESETS: Record<"full" | "minimal" | "showcase" | "numbers", BlockId[]> = {
  full: ALL,
  minimal: ["hero", "socials", "about", "wave"],
  showcase: ["hero", "socials", "projects", "stack", "wave", "buttons"],
  numbers: ["hero", "socials", "stats", "authoredStats", "streak", "wave"],
};

export type PresetId = keyof typeof PRESETS;

export function applyPreset(c: Config, id: PresetId): Config {
  const shown = PRESETS[id];
  return { ...c, order: [...shown, ...ALL.filter((b) => !shown.includes(b))], hidden: ALL.filter((b) => !shown.includes(b)) };
}

export function activePreset(c: Config): PresetId | null {
  const shown = c.order.filter((b) => !c.hidden.includes(b)).join();
  return (Object.keys(PRESETS) as PresetId[]).find((k) => PRESETS[k].join() === shown) ?? null;
}
