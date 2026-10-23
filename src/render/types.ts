export type BlockId = "hero" | "about" | "stack" | "projects" | "stats" | "authoredStats" | "streak" | "socials" | "wave" | "buttons";
export type ShapeName = "cookie" | "cookie12" | "clover" | "sunny" | "flower" | "pill" | "soft" | "gem";
export type SchemeName = "tonalSpot" | "vibrant" | "expressive" | "fidelity" | "monochrome";
export type Lang = "en" | "ru";

export interface Item {
  icon: string;
  label: string;
}

export interface LinkButton extends Item {
  url: string;
  style: "filled" | "tonal";
}

export interface Social {
  icon: string;
  url: string;
}

export interface Override {
  text?: string;
  icon?: string;
  shape?: ShapeName;
}

export interface Config {
  version: 2;
  login: string;
  seed: string;
  seedFromAvatar?: boolean;
  scheme: SchemeName;
  motion: boolean;
  iconFill?: boolean;
  order: BlockId[];
  hidden: BlockId[];
  hero: {
    greeting: string;
    name: string;
    subtitle: string;
    typing: boolean;
    avatarShape: ShapeName;
    chips: Item[];
  };
  about: { title: string; items: Item[] };
  stack: { title: string; groups: { title: string; items: Item[] }[] };
  projects: {
    source: "pinned" | "manual";
    repos: string[];
    overrides: Record<string, Override>;
    empty: string;
    fork: string;
  };
  stats: {
    title: string;
    stars: string;
    contributions: string;
    repos: string;
    followers: string;
    calendar: string;
    weekdays: string;
    languages: string;
    showLanguages: boolean;
  };
  authoredStats: {
    enabled: boolean;
    title: string;
    repositories: string;
    commits: string;
    changed: string;
    languages: string;
    noData: string;
    partial: string;
    topLanguages: number;
    topRepositories: number;
  };
  streak: { title: string; current: string; longest: string; days: string };
  socials: {
    items: Social[];
    variant: "icon" | "chip";
    fill: "tonal" | "filled" | "outlined" | "brand";
    shape?: ShapeName;
    card?: boolean;
  };
  buttons: { items: LinkButton[]; card?: boolean };
}

export interface Repo {
  name: string;
  url: string;
  text: string;
  fork: boolean;
  stars: number;
  language: string | null;
  topics: string[];
}

export interface Day {
  c: number;
  day: number;
  today?: boolean;
}

export interface Data {
  stars: number;
  contributions: number;
  repos: number;
  followers: number;
  languages: [string, number][];
  days: (Day | null)[][];
  streak: { current: number; longest: number };
  pins: Repo[];
  all: Repo[];
  authored?: AuthoredStats;
}

export interface AuthoredLanguage {
  name: string;
  additions: number;
  deletions: number;
  changed: number;
}

export interface AuthoredRepository {
  name: string;
  url: string;
  commits: number;
  additions: number;
  deletions: number;
}

export interface AuthoredStats {
  scope: "public" | "authenticated";
  repositoriesScanned: number;
  repositoriesWithCommits: number;
  commits: number;
  additions: number;
  deletions: number;
  languages: AuthoredLanguage[];
  repositories: AuthoredRepository[];
  partial?: { reason: "rate-limit" | "repository-limit" | "commit-limit" | "inaccessible"; scanned: number; total: number };
}

export interface Icons {
  symbol: Record<string, string>;
  brand: Record<string, { t: string; d: string; c?: string }>;
}

export type Palette = Record<string, string>;
