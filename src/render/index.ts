import { about, authoredStats, AUTO_ICONS, buttons, card, credit, hero, projectList, projectView, SITE_URL, socials, stack, stats, streak, wave } from "./blocks";
import { esc } from "./kit";
import { palette } from "./palette";
import type { BlockId, Config, Data, Icons, Lang } from "./types";

export * from "./types";
export { palette } from "./palette";
export { REPO_URL, SITE_URL } from "./blocks";

export const BLOCKS: BlockId[] = ["hero", "socials", "about", "stack", "projects", "stats", "authoredStats", "streak", "wave", "buttons"];

export function blockAsset(id: BlockId) {
  return id.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

// Defaults
export function defaults(login: string, lang: Lang): Config {
  const ru = lang === "ru";
  return {
    version: 2,
    login,
    seed: "#FF5CA8",
    seedFromAvatar: true,
    scheme: "tonalSpot",
    motion: true,
    iconFill: true,
    order: [...BLOCKS],
    hidden: [],
    hero: {
      greeting: ru ? "Привет, я" : "Hi, I'm",
      name: "",
      subtitle: ru ? "Делаю интерфейсы и небольшие полезные утилиты." : "I build interfaces and small useful tools.",
      typing: true,
      avatarShape: "cookie12",
      chips: [
        { icon: "location_on", label: ru ? "Земля" : "Earth" },
        { icon: "code", label: "TypeScript · Python" },
      ],
    },
    about: {
      title: ru ? "Обо мне" : "About me",
      items: [
        { icon: "person", label: ru ? "Разработчик и дизайнер" : "Developer and designer" },
        { icon: "code", label: ru ? "В основном фронтенд" : "Mostly frontend" },
        { icon: "palette", label: ru ? "Люблю Material Design" : "Into Material Design" },
      ],
    },
    stack: {
      title: ru ? "Стек" : "Tech stack",
      groups: [
        { title: "Main", items: [{ icon: "brand:typescript", label: "TypeScript" }, { icon: "brand:react", label: "React" }, { icon: "brand:python", label: "Python" }] },
        { title: "Tools", items: [{ icon: "brand:git", label: "Git" }, { icon: "brand:figma", label: "Figma" }, { icon: "brand:githubactions", label: "GitHub Actions" }] },
      ],
    },
    projects: {
      source: "pinned",
      repos: [],
      overrides: {},
      empty: ru ? "Описания пока нет." : "No description yet.",
      fork: "Fork",
    },
    stats: {
      title: ru ? "Активность на GitHub" : "GitHub activity",
      stars: ru ? "Звёзд получено" : "Stars earned",
      contributions: ru ? "Вкладов за год" : "Contributions this year",
      repos: ru ? "Публичных репо" : "Public repos",
      followers: ru ? "Подписчиков" : "Followers",
      calendar: ru ? "Последние 21 день" : "Last 21 days",
      weekdays: ru ? "ВПВСЧПС" : "SMTWTFS",
      languages: ru ? "Языки в моих репозиториях" : "Languages across my repositories",
      showLanguages: true,
    },
    authoredStats: {
      enabled: false,
      title: ru ? "Мой код на GitHub" : "My GitHub code",
      repositories: ru ? "Репозитории" : "Repositories",
      commits: ru ? "Коммиты" : "Commits",
      changed: ru ? "Изменено строк" : "Lines changed",
      languages: ru ? "Языки в моих коммитах" : "Languages in my commits",
      noData: ru ? "Коммиты пока не найдены" : "No authored commits found",
      partial: ru ? "Неполные данные" : "Partial data",
      topLanguages: 5,
      topRepositories: 4,
    },
    streak: {
      title: ru ? "Серия" : "Streak",
      current: ru ? "Текущая серия" : "Current streak",
      longest: ru ? "Рекорд за год" : "Longest this year",
      days: ru ? "дн." : "days",
    },
    socials: {
      items: [
        { icon: "brand:telegram", url: "https://t.me/" },
        { icon: "brand:discord", url: "https://discord.com/" },
        { icon: "brand:x", url: "https://x.com/" },
      ],
      variant: "chip",
      fill: "tonal",
      card: true,
    },
    buttons: {
      items: [
        { icon: "language", label: ru ? "Мой сайт" : "My website", url: "https://example.com", style: "filled" },
        { icon: "book_2", label: ru ? "Все репозитории" : "All repositories", url: "", style: "tonal" },
      ],
    },
  };
}

// Streak
export function streakOf(counts: number[], todayIncluded = true) {
  let longest = 0;
  let run = 0;
  for (const c of counts) {
    run = c > 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  let current = 0;
  let i = counts.length - 1;
  if (todayIncluded && i >= 0 && counts[i] === 0) i--;
  for (; i >= 0 && counts[i] > 0; i--) current++;
  return { current, longest };
}

// Files
export function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "x";
}

export function buttonUrl(c: Config, url: string) {
  return url || `https://github.com/${c.login}?tab=repositories`;
}

export function usedIcons(c: Config, d: Data) {
  const names = new Set<string>(["favorite", "code", "monitoring", "star", "commit", "book_2", "group", "arrow_outward", "person", "key", "analytics", "progress_activity", "difference", ...AUTO_ICONS]);
  for (const x of c.hero.chips) names.add(x.icon);
  for (const x of c.about.items) names.add(x.icon);
  for (const g of c.stack.groups) for (const x of g.items) names.add(x.icon);
  for (const x of c.buttons.items) names.add(x.icon);
  for (const x of c.socials.items) names.add(x.icon);
  names.add("local_fire_department");
  names.add("trophy");
  for (const o of Object.values(c.projects.overrides)) if (o.icon) names.add(o.icon);
  projectList(c, d).forEach((r, n) => names.add(projectView(c, r, n).icon));
  return [...names].filter(Boolean);
}

export function pickIcons(all: Icons, names: string[]): Icons {
  const out: Icons = { symbol: {}, brand: {} };
  for (const n of names) {
    if (n.startsWith("brand:")) {
      const b = all.brand[n.slice(6)];
      if (b) out.brand[n.slice(6)] = { t: b.t, d: b.d, c: b.c };
    } else {
      if (all.symbol[n]) out.symbol[n] = all.symbol[n];
      if (all.symbol[n + "#fill"]) out.symbol[n + "#fill"] = all.symbol[n + "#fill"];
    }
  }
  return out;
}

const filled = new WeakMap<Icons, Icons>();

export function withFill(icons: Icons): Icons {
  let hit = filled.get(icons);
  if (hit && Object.keys(hit.symbol).length === Object.keys(icons.symbol).length) return hit;
  const symbol = { ...icons.symbol };
  for (const [k, v] of Object.entries(icons.symbol)) if (k.endsWith("#fill")) symbol[k.slice(0, -5)] = v;
  hit = { brand: icons.brand, symbol };
  filled.set(icons, hit);
  return hit;
}

export function render(c: Config, d: Data, all: Icons, avatar: string | null, themes: ("light" | "dark")[] = ["light", "dark"]) {
  const icons = c.iconFill === false ? all : withFill(all);
  const files: Record<string, string> = {};
  const repos = projectList(c, d);
  for (const theme of themes) {
    const p = palette(c.seed, c.scheme, theme === "dark");
    const ctx = { c, d, p, i: icons };
    const put = (name: string, svg: string) => (files[`assets/${name}-${theme}.svg`] = svg);
    put("hero", hero(ctx, avatar));
    put("about", about(ctx));
    put("stack", stack(ctx));
    put("stats", stats(ctx));
    put(blockAsset("authoredStats"), authoredStats(ctx));
    put("wave", wave(ctx));
    put("streak", streak(ctx));
    for (const [name, svg] of Object.entries(socials(ctx))) put(name, svg);
    for (const [name, svg] of Object.entries(buttons(ctx))) put(name, svg);
    put("credit", credit(ctx));
    repos.forEach((r, n) => put(`project-${slug(r.name)}`, card(ctx, r, n)));
  }
  return files;
}

// Readme
function linkRow(files: Record<string, string>, prefix: string, links: { url: string; alt: string }[], loose: string, sep: string) {
  const width = (name: string) => Number(/width="([\d.]+)"/.exec(files[`assets/${name}-light.svg`] ?? "")?.[1] ?? 0);
  if (files[`assets/${prefix}-l-light.svg`]) {
    const pct = (name: string) => `${(Math.floor((width(name) / 840) * 100000) / 1000).toFixed(3)}%`;
    return (
      pic(`${prefix}-l`, "", pct(`${prefix}-l`)) +
      links.map((l, n) => `<a href="${esc(l.url)}">${pic(`${prefix}-${n + 1}`, l.alt, pct(`${prefix}-${n + 1}`))}</a>`).join("") +
      pic(`${prefix}-r`, "", pct(`${prefix}-r`))
    );
  }
  return links.map((l, n) => `<a href="${esc(l.url)}">${pic(`${prefix}-${n + 1}`, l.alt, loose)}</a>`).join(sep);
}

function pic(name: string, alt: string, width = "100%") {
  return (
    `<picture><source media="(prefers-color-scheme: dark)" srcset="assets/${name}-dark.svg">` +
    `<img src="assets/${name}-light.svg" width="${width}" alt="${esc(alt)}"></picture>`
  );
}

export function readme(c: Config, d: Data, files: Record<string, string>) {
  const repos = projectList(c, d);
  const parts: string[] = [];
  for (const id of c.order) {
    if (c.hidden.includes(id)) continue;
    if (id === "hero") parts.push(pic("hero", `${c.hero.greeting} ${c.hero.name || c.login}`));
    if (id === "about") parts.push(pic("about", c.about.title));
    if (id === "stack") parts.push(pic("stack", c.stack.title));
    if (id === "stats") parts.push(pic("stats", c.stats.title));
    if (id === "authoredStats") parts.push(pic(blockAsset(id), c.authoredStats.title));
    if (id === "wave") parts.push(pic("wave", ""));
    if (id === "streak") parts.push(pic("streak", c.streak.title));
    if (id === "socials" && c.socials.items.length) {
      const links = c.socials.items.map((s) => ({ url: s.url, alt: s.icon.replace("brand:", "") }));
      parts.push(linkRow(files, "social", links, c.socials.variant === "chip" ? "auto" : "56", "&nbsp;"));
    }
    if (id === "projects") {
      const cards = repos.map((r) => `<a href="${esc(r.url)}">${pic(`project-${slug(r.name)}`, r.name, "49%")}</a>`);
      for (let n = 0; n < cards.length; n += 2) parts.push(cards.slice(n, n + 2).join("&nbsp;"));
    }
    if (id === "buttons" && c.buttons.items.length) {
      const links = c.buttons.items.map((b) => ({ url: buttonUrl(c, b.url), alt: b.label }));
      parts.push(linkRow(files, "button", links, "auto", "&nbsp;&nbsp;"));
    }
  }
  parts.push(`<a href="${SITE_URL}?from=${encodeURIComponent(c.login)}">${pic("credit", "Made with Expressive Profile", "auto")}</a>`);
  return '<div align="center">\n\n' + parts.join("\n\n") + "\n\n</div>\n";
}
