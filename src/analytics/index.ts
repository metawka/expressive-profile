import type { AuthoredLanguage, AuthoredStats } from "../render";
import linguist from "./linguist.json";

const API = "https://api.github.com";
const MAX_REPOSITORIES = 100;
const MAX_COMMITS = 5000;
const REQUEST_CONCURRENCY = 4;
const REPOSITORY_CONCURRENCY = 3;
const MIN_REQUEST_INTERVAL_MS = 90;
const EXCLUDED = /(^|\/)(node_modules|vendor|dist|build|coverage|\.next|\.nuget)(\/|$)|(^|\/)(package-lock\.json|npm-shrinkwrap\.json|yarn\.lock|pnpm-lock\.yaml|composer\.lock|cargo\.lock|go\.sum)$/i;
const MINIFIED = /\.min\.(?:js|css)$/i;

export class GitHubAnalysisError extends Error {
  constructor(message: "auth" | "mismatch" | "rate-limit" | "failed", readonly reset?: Date) {
    super(message);
  }
}

type ApiFetch = (path: string) => Promise<Response>;
type ApiRepository = { full_name: string; name: string; html_url: string; disabled?: boolean };
type ApiCommit = { sha: string; author?: { login?: string | null } | null; commit?: { author?: { email?: string | null } | null } | null };

export interface RateLimitStatus { limit: number; remaining: number; reset?: Date; }
export interface AnalysisProgress {
  repository: string;
  completed: number;
  total: number;
  commits: number;
  rateLimit?: RateLimitStatus;
}
export interface AnalysisOptions {
  login: string;
  token?: string;
  maxRepositories?: number;
  maxCommits?: number;
  onProgress?: (progress: AnalysisProgress) => void;
  request?: ApiFetch;
}

function headers(token?: string) {
  return { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

function nextLink(link: string | null) {
  if (!link) return null;
  const item = link.split(",").find((value) => /rel="next"/.test(value));
  return item ? /<([^>]+)>/.exec(item)?.[1] ?? null : null;
}

function toPath(url: string) {
  const parsed = new URL(url);
  return parsed.pathname + parsed.search;
}

function requestPool(request: ApiFetch, concurrency: number): ApiFetch {
  let active = 0;
  let nextStart = 0;
  const queue: { path: string; resolve: (response: Response) => void; reject: (error: unknown) => void }[] = [];
  const run = () => {
    while (active < concurrency && queue.length) {
      const item = queue.shift()!;
      active++;
      const start = Math.max(Date.now(), nextStart);
      nextStart = start + MIN_REQUEST_INTERVAL_MS;
      const wait = Math.max(0, start - Date.now());
      setTimeout(() => {
        request(item.path).then(item.resolve, item.reject).finally(() => {
          active--;
          run();
        });
      }, wait);
    }
  };
  return (path) => new Promise<Response>((resolve, reject) => {
    queue.push({ path, resolve, reject });
    run();
  });
}

async function mapLimit<T>(values: T[], concurrency: number, worker: (value: T) => Promise<void>) {
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, async () => {
    while (cursor < values.length) {
      const index = cursor++;
      await worker(values[index]);
    }
  }));
}

async function page<T>(request: ApiFetch, path: string, result: T[] = []): Promise<T[]> {
  const response = await request(path);
  if (!response.ok) throw response;
  result.push(...(await response.json() as T[]));
  const next = nextLink(response.headers.get("link"));
  return next ? page<T>(request, toPath(next), result) : result;
}

function language(path: string) {
  if (EXCLUDED.test(path) || MINIFIED.test(path)) return null;
  const name = path.split("/").pop()?.toLowerCase() ?? "";
  const byName = (linguist.filenames as Record<string, string>)[name];
  if (byName) return byName;
  for (let dot = name.indexOf("."); dot >= 0; dot = name.indexOf(".", dot + 1)) {
    const byExtension = (linguist.extensions as Record<string, string>)[name.slice(dot)];
    if (byExtension) return byExtension;
  }
  return null;
}

function authored(commit: ApiCommit, login: string, emails: Set<string>) {
  if (commit.author?.login?.toLowerCase() === login.toLowerCase()) return true;
  const email = commit.commit?.author?.email?.toLowerCase();
  return !!email && emails.has(email);
}

function partial(reason: AuthoredStats["partial"] extends infer T ? T extends { reason: infer R } ? R : never : never, scanned: number, total: number) {
  return { reason, scanned, total } as AuthoredStats["partial"];
}

export async function analyzeAuthoredStats(options: AnalysisOptions): Promise<AuthoredStats> {
  const login = options.login.trim();
  const token = options.token?.trim() || undefined;
  const rawRequest: ApiFetch = options.request ?? ((path) => fetch(`${API}${path}`, { headers: headers(token) }));
  const maxRepositories = options.maxRepositories ?? MAX_REPOSITORIES;
  const maxCommits = options.maxCommits ?? MAX_COMMITS;
  const scope: AuthoredStats["scope"] = token ? "authenticated" : "public";
  const reserve = token ? 100 : 5;
  const progress: AnalysisProgress = { repository: "", completed: 0, total: 0, commits: 0 };
  let rateLimit: RateLimitStatus | undefined;
  const report = () => options.onProgress?.({ ...progress, rateLimit });
  const pooledRequest = requestPool(rawRequest, REQUEST_CONCURRENCY);
  const request: ApiFetch = async (path) => {
    if (rateLimit && rateLimit.remaining <= reserve) throw new GitHubAnalysisError("rate-limit", rateLimit.reset);
    const response = await pooledRequest(path);
    const limitHeader = response.headers.get("x-ratelimit-limit");
    const remainingHeader = response.headers.get("x-ratelimit-remaining");
    const limit = Number(limitHeader);
    const remaining = Number(remainingHeader);
    const reset = Number(response.headers.get("x-ratelimit-reset"));
    if (limitHeader !== null && remainingHeader !== null && Number.isFinite(limit) && Number.isFinite(remaining)) {
      rateLimit = { limit, remaining, reset: reset ? new Date(reset * 1000) : undefined };
      report();
    }
    return response;
  };

  const checked = async (path: string) => {
    const response = await request(path);
    if (response.status === 401) throw new GitHubAnalysisError("auth");
    if (response.status === 403 || response.status === 429) {
      const reset = Number(response.headers.get("x-ratelimit-reset"));
      throw new GitHubAnalysisError("rate-limit", reset ? new Date(reset * 1000) : rateLimit?.reset);
    }
    if (!response.ok) throw new GitHubAnalysisError("failed");
    return response;
  };

  let authorLogin = login;
  let emails = new Set<string>();
  if (token) {
    const viewer = await (await checked("/user")).json() as { login?: string; email?: string | null };
    if (!viewer.login || viewer.login.toLowerCase() !== login.toLowerCase()) throw new GitHubAnalysisError("mismatch");
    authorLogin = viewer.login;
    if (viewer.email) emails.add(viewer.email.toLowerCase());
  }

  let repositories: ApiRepository[];
  try {
    repositories = token
      ? await page<ApiRepository>(request, "/user/repos?affiliation=owner,collaborator,organization_member&visibility=all&per_page=100&sort=updated")
      : await page<ApiRepository>(request, `/users/${encodeURIComponent(login)}/repos?type=owner&per_page=100&sort=updated`);
  } catch (error) {
    if (error instanceof GitHubAnalysisError) throw error;
    const response = error as Response;
    if (response.status === 403 || response.status === 429) throw new GitHubAnalysisError("rate-limit", rateLimit?.reset);
    throw new GitHubAnalysisError("failed");
  }

  const stats: AuthoredStats = { scope, repositoriesScanned: 0, repositoriesWithCommits: 0, commits: 0, additions: 0, deletions: 0, languages: [], repositories: [] };
  const languages = new Map<string, AuthoredLanguage>();
  const total = Math.min(repositories.length, maxRepositories);
  progress.total = total;
  report();
  if (repositories.length > maxRepositories) stats.partial = partial("repository-limit", 0, repositories.length);
  const seen = new Set<string>();
  let stopped = false;

  await mapLimit(repositories.slice(0, maxRepositories), REPOSITORY_CONCURRENCY, async (repository) => {
    if (stopped || repository.disabled) return;
    progress.repository = repository.name;
    report();
    try {
      const branches = await page<{ name: string }>(request, `/repos/${repository.full_name}/branches?per_page=100`);
      const commits = new Map<string, ApiCommit>();
      await Promise.all(branches.map(async (branch) => {
        const list = await page<ApiCommit>(request, `/repos/${repository.full_name}/commits?sha=${encodeURIComponent(branch.name)}&author=${encodeURIComponent(authorLogin)}&per_page=100`);
        for (const commit of list) if (authored(commit, authorLogin, emails)) commits.set(commit.sha, commit);
      }));
      let repoCommits = 0;
      let additions = 0;
      let deletions = 0;
      await mapLimit([...commits.values()], REQUEST_CONCURRENCY, async (commit) => {
        if (stopped) return;
        if (seen.has(commit.sha)) return;
        if (seen.size >= maxCommits) {
          stats.partial = partial("commit-limit", stats.repositoriesScanned, total);
          stopped = true;
          return;
        }
        seen.add(commit.sha);
        const detail = await checked(`/repos/${repository.full_name}/commits/${commit.sha}`);
        const body = await detail.json() as { files?: { filename?: string; additions?: number; deletions?: number }[] };
        repoCommits++;
        stats.commits++;
        progress.commits = stats.commits;
        report();
        for (const file of body.files ?? []) {
          const kind = language(file.filename ?? "");
          if (!kind) continue;
          const plus = file.additions ?? 0;
          const minus = file.deletions ?? 0;
          additions += plus;
          deletions += minus;
          const current = languages.get(kind) ?? { name: kind, additions: 0, deletions: 0, changed: 0 };
          current.additions += plus;
          current.deletions += minus;
          current.changed += plus + minus;
          languages.set(kind, current);
        }
      });
      if (repoCommits) {
        stats.repositoriesWithCommits++;
        stats.additions += additions;
        stats.deletions += deletions;
        stats.repositories.push({ name: repository.name, url: repository.html_url, commits: repoCommits, additions, deletions });
      }
      stats.repositoriesScanned++;
      progress.completed = stats.repositoriesScanned;
      report();
    } catch (error) {
      if (error instanceof GitHubAnalysisError && error.message === "rate-limit") {
        stats.partial = partial("rate-limit", stats.repositoriesScanned, total);
        stopped = true;
        return;
      }
      stats.partial ??= partial("inaccessible", stats.repositoriesScanned, total);
      stats.repositoriesScanned++;
      progress.completed = stats.repositoriesScanned;
      report();
    }
  });
  stats.languages = [...languages.values()].sort((a, b) => b.changed - a.changed);
  stats.repositories.sort((a, b) => b.additions + b.deletions - (a.additions + a.deletions));
  return stats;
}
