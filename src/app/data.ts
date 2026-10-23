import { zipSync, strToU8 } from "fflate";
import { analyzeAuthoredStats, type AnalysisProgress } from "../analytics";
import core from "../render/core-icons.json";
import { pickIcons, readme, render, streakOf, usedIcons, type AuthoredStats, type Config, type Data, type Day, type Icons, type Repo } from "../render";

// Icons
export const store: Icons = structuredClone(core) as Icons;
let full: Promise<void> | null = null;

export function loadAllIcons() {
  full ??= Promise.all([
    fetch("symbols.json").then((r) => r.json()),
    fetch("brands.json").then((r) => r.json()),
  ]).then(([s, b]) => {
    Object.assign(store.symbol, s);
    Object.assign(store.brand, b);
  });
  return full;
}

export function hasIcon(name: string) {
  return name.startsWith("brand:") ? !!store.brand[name.slice(6)] : !!store.symbol[name];
}

// Demo
function demoDays(): (Day | null)[][] {
  const now = new Date();
  const out: (Day | null)[][] = [];
  const seed = [3, 0, 5, 8, 2, 0, 1, 4, 6, 0, 2, 9, 3, 1, 0, 7, 4, 2, 5, 0, 3];
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay() - 14);
  for (let w = 0; w < 3; w++) {
    const row: (Day | null)[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(start);
      date.setDate(start.getDate() + w * 7 + d);
      row.push(date > now ? null : { c: seed[w * 7 + d], day: date.getDate(), today: date.toDateString() === now.toDateString() });
    }
    out.push(row);
  }
  return out;
}

const demoRepos: Repo[] = [
  { name: "pixel-garden", url: "#", text: "A cozy pixel art editor that runs in the browser", fork: false, stars: 64, language: "TypeScript", topics: ["design"] },
  { name: "tiny-weather", url: "#", text: "Minimal weather widget for the desktop", fork: false, stars: 31, language: "Rust", topics: [] },
  { name: "echo-bot", url: "#", text: "Discord bot that plays lo-fi radio", fork: false, stars: 18, language: "Python", topics: ["discord"] },
  { name: "dotfiles", url: "#", text: "Hyprland setup with Material You colors", fork: true, stars: 9, language: "Shell", topics: ["hyprland"] },
];

export const DEMO: Data = {
  stars: 128,
  contributions: 1024,
  repos: 24,
  followers: 56,
  languages: [["TypeScript", 48], ["Python", 22], ["Rust", 14], ["CSS", 9], ["HTML", 7]],
  days: demoDays(),
  streak: { current: 4, longest: 23 },
  pins: demoRepos,
  all: demoRepos,
};

// Github
export class LoadError extends Error {
  reset?: Date;
}

async function api(path: string) {
  const r = await fetch(`https://api.github.com/${path}`, { headers: { Accept: "application/vnd.github+json" } });
  if (r.status === 404) throw new LoadError("notFound");
  if (r.status === 403 || r.status === 429) {
    const e = new LoadError("limit");
    const reset = Number(r.headers.get("x-ratelimit-reset"));
    if (reset) e.reset = new Date(reset * 1000);
    throw e;
  }
  if (!r.ok) throw new LoadError("failed");
  return r.json();
}

async function toDataUrl(url: string) {
  try {
    const blob = await (await fetch(url)).blob();
    return await new Promise<string>((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result as string);
      fr.onerror = rej;
      fr.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function daysFromEvents(events: any[]) {
  const counts: Record<string, number> = {};
  for (const e of events) {
    const key = e.created_at.slice(0, 10);
    let n = 0;
    if (e.type === "PushEvent") n = e.payload?.distinct_size ?? e.payload?.size ?? 1;
    else if (["PullRequestEvent", "IssuesEvent"].includes(e.type) && e.payload?.action === "opened") n = 1;
    else if (["CreateEvent", "PullRequestReviewEvent"].includes(e.type)) n = 1;
    counts[key] = (counts[key] ?? 0) + n;
  }
  const now = new Date();
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay() - 14);
  const out: (Day | null)[][] = [];
  for (let w = 0; w < 3; w++) {
    const row: (Day | null)[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(start);
      date.setDate(start.getDate() + w * 7 + d);
      row.push(date > now ? null : { c: counts[iso(date)] ?? 0, day: date.getDate(), today: iso(date) === iso(now) });
    }
    out.push(row);
  }
  const year = String(now.getFullYear());
  const total = Object.entries(counts).filter(([k]) => k.startsWith(year)).reduce((a, [, v]) => a + v, 0);
  const series: number[] = [];
  for (let back = 89; back >= 0; back--) {
    const d = new Date(now);
    d.setDate(now.getDate() - back);
    series.push(counts[iso(d)] ?? 0);
  }
  return { days: out, total, streak: streakOf(series) };
}

type Loaded = { data: Data; avatar: string | null; stale?: boolean; exact?: boolean };
const cache = new Map<string, Promise<Loaded>>();
const FRESH = 30 * 60 * 1000;
const AUTHORED_CACHE_VERSION = 1;
const AUTHORED_FRESH = 7 * 24 * 60 * 60 * 1000;

function authoredKey(login: string) {
  return `ep:authored:${login.trim().toLowerCase()}`;
}

export function loadSavedAuthoredStats(login: string): AuthoredStats | null {
  const key = authoredKey(login);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const saved = JSON.parse(raw) as { version?: number; t?: number; value?: AuthoredStats };
    if (saved.version !== AUTHORED_CACHE_VERSION || !saved.t || Date.now() - saved.t >= AUTHORED_FRESH || !saved.value) {
      localStorage.removeItem(key);
      return null;
    }
    return saved.value;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

export function saveAuthoredStats(login: string, value: AuthoredStats) {
  try {
    localStorage.setItem(authoredKey(login), JSON.stringify({ version: AUTHORED_CACHE_VERSION, t: Date.now(), value }));
  } catch {}
}

function saved(key: string): { t: number; v: Loaded } | null {
  try {
    const raw = localStorage.getItem(`ep:gh:${key}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function save(key: string, v: Loaded) {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k?.startsWith("ep:gh:") && k !== `ep:gh:${key}`) localStorage.removeItem(k);
    }
    localStorage.setItem(`ep:gh:${key}`, JSON.stringify({ t: Date.now(), v }));
  } catch {}
}

export function loadProfile(login: string, force = false): Promise<Loaded> {
  const key = login.toLowerCase();
  const hit = saved(key);
  if (!force && hit && Date.now() - hit.t < FRESH) return Promise.resolve(hit.v);
  if (!cache.has(key) || force) {
    const p = fetchProfile(login).then(
      (v) => {
        save(key, v);
        return v;
      },
      (e) => {
        cache.delete(key);
        if (e instanceof LoadError && e.message === "limit" && hit) return { ...hit.v, stale: true };
        throw e;
      },
    );
    cache.set(key, p);
  }
  return cache.get(key)!;
}

export function loadAuthoredStats(login: string, token?: string, onProgress?: (progress: AnalysisProgress) => void) {
  return analyzeAuthoredStats({ login, token, onProgress });
}

async function fetchProfile(login: string) {
  const user = await api(`users/${encodeURIComponent(login)}`);
  const [repos, events] = await Promise.all([
    api(`users/${encodeURIComponent(login)}/repos?per_page=100&type=owner&sort=pushed`),
    api(`users/${encodeURIComponent(login)}/events/public?per_page=100`).catch(() => []),
  ]);
  const all: Repo[] = repos.map((r: any) => ({
    name: r.name,
    url: r.html_url,
    text: (r.description || "").trim(),
    fork: r.fork,
    stars: r.stargazers_count,
    language: r.language,
    topics: r.topics ?? [],
  }));
  const langs: Record<string, number> = {};
  for (const r of repos) if (!r.fork && r.language) langs[r.language] = (langs[r.language] ?? 0) + Math.max(1, r.size);
  const own = all.filter((r) => !r.fork);
  const pins = [...own].sort((a, b) => b.stars - a.stars).slice(0, 4);
  const { days, total, streak } = daysFromEvents(events);
  const data: Data = {
    stars: own.reduce((a, r) => a + r.stars, 0),
    contributions: total,
    repos: user.public_repos,
    followers: user.followers,
    languages: Object.entries(langs).sort((a, b) => b[1] - a[1]).slice(0, 7),
    days,
    streak,
    pins,
    all,
  };
  const avatar = await toDataUrl(`${user.avatar_url}${user.avatar_url.includes("?") ? "&" : "?"}s=320`);
  const saved = await actionData(login);
  if (saved) {
    data.pins = saved.pins ?? data.pins;
    data.languages = saved.languages ?? data.languages;
    data.contributions = saved.contributions ?? data.contributions;
    data.stars = saved.stars ?? data.stars;
    data.streak = saved.streak ?? data.streak;
    data.authored = saved.authored ?? data.authored;
  }
  return { data, avatar, name: user.name as string | null, exact: !!saved };
}

async function actionData(login: string): Promise<Partial<Data> | null> {
  try {
    const name = encodeURIComponent(login);
    const r = await fetch(`https://raw.githubusercontent.com/${name}/${name}/HEAD/.profile/data.json`);
    if (!r.ok) return null;
    const j = await r.json();
    return Array.isArray(j.pins) ? j : null;
  } catch {
    return null;
  }
}

// Zip
const WORKFLOW = `name: Expressive Profile

on:
  schedule:
    - cron: "17 * * * *"
  workflow_dispatch:
  push:
    paths:
      - profile.json
      - .profile/icons.json
      - .github/workflows/expressive-profile.yml

permissions:
  contents: write

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: metawka/expressive-profile@v1
        with:
          token: \${{ secrets.PROFILE_TOKEN || github.token }}
`;

export function profileFiles(c: Config, d: Data, avatar: string | null) {
  const svgs = render(c, d, store, avatar);
  const files: Record<string, string> = { ...svgs };
  files["README.md"] = readme(c, d, svgs);
  files["profile.json"] = JSON.stringify(c, null, 2) + "\n";
  files[".profile/icons.json"] = JSON.stringify(pickIcons(store, usedIcons(c, d)));
  files[".github/workflows/expressive-profile.yml"] = WORKFLOW;
  return files;
}

export async function buildZip(c: Config, d: Data, avatar: string | null) {
  const files: Record<string, Uint8Array> = {};
  for (const [path, text] of Object.entries(profileFiles(c, d, avatar))) files[path] = strToU8(text);
  const zip = zipSync(files, { level: 9 });
  const url = URL.createObjectURL(new Blob([zip], { type: "application/zip" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${c.login}-profile.zip`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
