import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import core from "../render/core-icons.json";
import { analyzeAuthoredStats } from "../analytics";
import { readme, render, streakOf, type Config, type Data, type Day, type Icons, type Repo } from "../render";

const NOISE = new Set(["Inno Setup", "Batchfile", "PowerShell", "VBScript", "Shell", "Makefile", "Dockerfile"]);
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";

async function graphql<T>(query: string, variables: object = {}): Promise<T> {
  const r = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `bearer ${token}`, "User-Agent": "expressive-profile" },
    body: JSON.stringify({ query, variables }),
  });
  const j = await r.json();
  if (j.errors) throw new Error(JSON.stringify(j.errors));
  return j.data;
}

const REPO = `name url description isFork stargazerCount primaryLanguage{name} repositoryTopics(first:10){nodes{topic{name}}}`;

interface RawRepo {
  name: string;
  url: string;
  description: string | null;
  isFork: boolean;
  stargazerCount: number;
  primaryLanguage: { name: string } | null;
  repositoryTopics: { nodes: { topic: { name: string } }[] };
  languages?: { edges: { size: number; node: { name: string } }[] };
}

function repo(n: RawRepo): Repo {
  return {
    name: n.name,
    url: n.url,
    text: (n.description || "").trim(),
    fork: n.isFork,
    stars: n.stargazerCount,
    language: n.primaryLanguage?.name ?? null,
    topics: n.repositoryTopics.nodes.map((t) => t.topic.name),
  };
}

function languages(nodes: RawRepo[]): [string, number][] {
  const sum: Record<string, number> = {};
  for (const r of nodes) {
    if (r.isFork) continue;
    for (const e of r.languages?.edges ?? []) if (!NOISE.has(e.node.name)) sum[e.node.name] = (sum[e.node.name] ?? 0) + e.size;
  }
  return Object.entries(sum).sort((a, b) => b[1] - a[1]).slice(0, 7);
}

async function fetchData(login: string): Promise<Data> {
  const LANGS = "languages(first:10,orderBy:{field:SIZE,direction:DESC}){edges{size node{name}}}";
  const { user } = await graphql<{ user: any }>(
    `query($login:String!){user(login:$login){
      followers{totalCount}
      repositories(ownerAffiliations:OWNER,privacy:PUBLIC,first:100,orderBy:{field:STARGAZERS,direction:DESC}){totalCount nodes{${REPO} ${LANGS}}}
      pinnedItems(first:6,types:REPOSITORY){nodes{... on Repository{${REPO}}}}
      contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{contributionCount date weekday}}}}}}`,
    { login },
  );
  const nodes: RawRepo[] = user.repositories.nodes;
  let langs = languages(nodes);
  try {
    const { viewer } = await graphql<{ viewer: any }>(`{viewer{login repositories(ownerAffiliations:OWNER,first:100){nodes{isFork ${LANGS}}}}}`);
    if (viewer.login.toLowerCase() === login.toLowerCase()) langs = languages(viewer.repositories.nodes);
  } catch {}
  const today = new Date().toISOString().slice(0, 10);
  const days: (Day | null)[][] = [];
  for (const w of user.contributionsCollection.contributionCalendar.weeks.slice(-3)) {
    const row: (Day | null)[] = Array(7).fill(null);
    for (const d of w.contributionDays) row[d.weekday] = { c: d.contributionCount, day: +d.date.slice(8), today: d.date === today };
    days.push(row);
  }
  while (days.length < 3) days.unshift(Array(7).fill(null));
  const counts: number[] = user.contributionsCollection.contributionCalendar.weeks
    .flatMap((w: any) => w.contributionDays)
    .filter((d: any) => d.date <= today)
    .map((d: any) => d.contributionCount);
  return {
    stars: nodes.filter((r) => !r.isFork).reduce((a, r) => a + r.stargazerCount, 0),
    contributions: user.contributionsCollection.contributionCalendar.totalContributions,
    repos: user.repositories.totalCount,
    followers: user.followers.totalCount,
    languages: langs,
    days,
    streak: streakOf(counts),
    pins: user.pinnedItems.nodes.filter(Boolean).map(repo),
    all: nodes.map(repo),
  };
}

async function avatar(login: string) {
  try {
    const r = await fetch(`https://github.com/${login}.png?size=320`);
    if (!r.ok) return null;
    const type = r.headers.get("content-type") || "image/png";
    return `data:${type};base64,${Buffer.from(await r.arrayBuffer()).toString("base64")}`;
  } catch {
    return null;
  }
}

function hash(s: string) {
  let h = 0;
  for (let n = 0; n < s.length; n++) h = (h * 31 + s.charCodeAt(n)) | 0;
  return (h >>> 0).toString(16);
}

// Main
async function main() {
  const config: Config = JSON.parse(readFileSync("profile.json", "utf8"));
  const icons: Icons = structuredClone(core) as Icons;
  if (existsSync(".profile/icons.json")) {
    const own: Icons = JSON.parse(readFileSync(".profile/icons.json", "utf8"));
    Object.assign(icons.symbol, own.symbol);
    Object.assign(icons.brand, own.brand);
  }
  mkdirSync(".profile", { recursive: true });
  const cacheFile = ".profile/data.json";
  const cached = existsSync(cacheFile) ? JSON.parse(readFileSync(cacheFile, "utf8")) : null;
  const data = await fetchData(config.login);
  try {
    data.authored = await analyzeAuthoredStats({ login: config.login, token: token || undefined });
  } catch (error) {
    if (token && error instanceof Error && error.message === "mismatch") data.authored = await analyzeAuthoredStats({ login: config.login });
    else throw error;
  }
  const ava = await avatar(config.login);
  const { days, ...rest } = data;
  const day = new Date().toISOString().slice(0, 10);
  const key = hash(JSON.stringify({ rest, day, avatar: ava ? hash(ava) : null, config }));
  if (process.env.GITHUB_EVENT_NAME === "schedule" && cached?.key === key) {
    console.log("no changes");
    return;
  }
  writeFileSync(cacheFile, JSON.stringify({ key, ...data }, null, 1));
  const files = render(config, data, icons, ava);
  mkdirSync("assets", { recursive: true });
  for (const f of readdirSync("assets")) if (f.endsWith(".svg") && !files[`assets/${f}`]) unlinkSync(`assets/${f}`);
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
  }
  writeFileSync("README.md", readme(config, data, files));
  console.log("done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
