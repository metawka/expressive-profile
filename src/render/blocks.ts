import { chip, esc, fit, icon, mix, pop, shape, svg, textWidth, txt, wrap } from "./kit";
import type { Config, Data, Icons, LinkButton, Palette, Repo, ShapeName, Social } from "./types";

export const W = 840;
export const CARD_SHAPES: ShapeName[] = ["cookie", "clover", "sunny", "flower"];
export const REPO_URL = "https://github.com/metawka/expressive-profile";
export const SITE_URL = "https://metawka.github.io/expressive-profile/";

const ICON_RULES: [string[], string][] = [
  [["zip", "archive", "7-zip", "rar"], "folder_zip"],
  [["music", "audio", "spotify", "player", "sound"], "music_note"],
  [["dictat", "speech", "voice", "whisper", "mic"], "mic"],
  [["tracker", "screen time", "activity", "monitor", "stats"], "monitoring"],
  [["discord"], "brand:discord"],
  [["game", "minecraft", "mod "], "sports_esports"],
  [["site", "website", "web ", "landing", "portfolio"], "language"],
  [["launcher", "installer"], "deployed_code"],
  [["theme", "design", "ui kit", "palette"], "palette"],
  [["terminal", "cli", "shell", "dotfiles", "hyprland"], "terminal"],
];

const LANG_ICONS: Record<string, string> = {
  Rust: "brand:rust",
  Python: "brand:python",
  TypeScript: "brand:typescript",
  JavaScript: "brand:javascript",
  "C#": "brand:dotnet",
  Java: "brand:openjdk",
  Go: "brand:go",
  Kotlin: "brand:kotlin",
  Swift: "brand:swift",
  "C++": "brand:cplusplus",
  Dart: "brand:dart",
  PHP: "brand:php",
  HTML: "brand:html5",
  CSS: "brand:css",
  Vue: "brand:vuedotjs",
  Svelte: "brand:svelte",
};

export const AUTO_ICONS = [...new Set([...ICON_RULES.map(([, n]) => n), ...Object.values(LANG_ICONS), "code"])];

interface Ctx {
  c: Config;
  d: Data;
  p: Palette;
  i: Icons;
}

function sectionTitle(x: number, y: number, label: string, ic: string, { p, i }: Ctx, delay = 0) {
  const tile = `<path class="pop" style="animation-delay:${delay.toFixed(2)}s" d="${shape("cookie", x + 20, y + 20, 20)}" fill="${p.primaryContainer}"/>`;
  const glyph = pop(icon(i, ic, x + 9, y + 9, 22, p.onPrimaryContainer), delay + 0.05);
  return tile + glyph + txt(x + 54, y + 28, fit(label, 24, W - x - 82, 600), 24, p.onSurface, { weight: 600, cls: "up", delay });
}

// Hero
export function hero(ctx: Ctx, avatar: string | null) {
  const { c, p, i } = ctx;
  const h = 300;
  const b = [`<clipPath id="card"><rect width="${W}" height="${h}" rx="32"/></clipPath>`];
  b.push(`<rect width="${W}" height="${h}" rx="32" fill="${p.surfaceContainer}"/>`);
  b.push('<g clip-path="url(#card)">');
  b.push(`<path class="spin" d="${shape("flower", 780, 30, 150)}" fill="${p.primaryContainer}"/>`);
  b.push(`<path class="bob" d="${shape("clover", 690, 292, 62)}" fill="${p.tertiaryContainer}"/>`);
  b.push(`<path class="spin-r" d="${shape("sunny", 812, 236, 34)}" fill="${p.secondaryContainer}"/>`);
  b.push("</g>");
  const cx = 150;
  const cy = 150;
  const frame = c.hero.avatarShape;
  b.push(`<path class="spin" d="${shape("sunny", cx, cy, 112)}" fill="${p.primary}" opacity=".9"/>`);
  b.push(`<clipPath id="ava"><path d="${shape(frame, cx, cy, 98)}"/></clipPath>`);
  b.push(`<path d="${shape(frame, cx, cy, 102)}" fill="${p.surfaceContainer}"/>`);
  if (avatar) {
    b.push(`<g class="fade"><image href="${avatar}" x="${cx - 100}" y="${cy - 100}" width="200" height="200" clip-path="url(#ava)" preserveAspectRatio="xMidYMid slice"/></g>`);
  } else {
    b.push(`<path d="${shape(frame, cx, cy, 98)}" fill="${p.primaryContainer}"/>`);
    b.push(icon(i, "person", cx - 44, cy - 44, 88, p.onPrimaryContainer));
  }
  const x = 294;
  const name = c.hero.name || c.login;
  const room = W - x - 40;
  const size = Math.min(68, room / Math.max(1, textWidth(name, 1, 700)));
  b.push(txt(x, 92, c.hero.greeting, 22, p.onSurfaceVariant, { weight: 500, cls: "up", delay: 0.1 }));
  b.push(pop(txt(x - 3, 156, name, size, p.onSurface, { cls: "wght" }), 0.2, "up"));
  const lines = wrap(c.hero.subtitle, 19, 430, 400, 2);
  let extra = "";
  if (c.hero.typing && c.motion && lines.join("")) {
    const [body, css] = typing(lines, x, p);
    b.push(body);
    extra = css;
  } else lines.forEach((line, n) => {
    b.push(txt(x, 194 + n * 26, line, 19, p.onSurfaceVariant, { cls: "up", delay: 0.35 + n * 0.08 }));
  });
  let cx2 = x;
  c.hero.chips.forEach((item, n) => {
    const [g, w] = chip(i, p, cx2, 236, item.label, { icon: item.icon, delay: 0.6 + n * 0.1, style: "tonal" });
    if (cx2 + w > W - 24) return;
    b.push(g);
    cx2 += w + 8;
  });
  return svg(W, h, b.join(""), `${c.hero.greeting} ${name}`, c.motion, extra);
}

function typing(lines: string[], x: number, p: Palette): [string, string] {
  const t0 = 0.7;
  const step = 0.05;
  const chars = lines.map((l) => [...l]);
  const n = chars.reduce((a, l) => a + l.length, 0);
  const dur = t0 + n * step;
  const starts = chars.map((_, li) => chars.slice(0, li).reduce((a, l) => a + l.length, 0));
  const revealed = (li: number, k: number) => {
    const m = Math.max(0, Math.min(chars[li].length, k - starts[li]));
    return m ? textWidth(chars[li].slice(0, m).join(""), 19) + 2 : 0;
  };
  const ks = Array.from({ length: n + 1 }, (_, k) => k);
  const times = ["0", ...ks.map((k) => ((t0 + k * step) / dur).toFixed(4))].join(";");
  const smil = (attr: string, values: string[]) =>
    `<animate attributeName="${attr}" values="${values.join(";")}" keyTimes="${times}" calcMode="discrete" dur="${dur.toFixed(2)}s" fill="freeze"/>`;
  const out: string[] = [];
  lines.forEach((line, li) => {
    const y = 194 + li * 26;
    const full = textWidth(line, 19) + 4;
    const widths = ["0", ...ks.map((k) => revealed(li, k).toFixed(1))];
    out.push(`<clipPath id="tc${li}"><rect x="${x - 2}" y="${y - 22}" width="${full}" height="30">${smil("width", widths)}</rect></clipPath>`);
    out.push(`<g clip-path="url(#tc${li})">${txt(x, y, line, 19, p.onSurfaceVariant)}</g>`);
  });
  const last = lines.length - 1;
  const pos = (k: number) => {
    let li = chars.findIndex((_, i) => k <= starts[i] + chars[i].length);
    if (li < 0) li = last;
    return [x + revealed(li, k), 194 + li * 26];
  };
  const [fx, fy] = pos(n);
  const moves = [pos(0), ...ks.map(pos)].map(([cx, cy]) => `${(cx - fx).toFixed(1)} ${cy - fy}`);
  out.push(
    `<rect x="${fx.toFixed(1)}" y="${fy - 17}" width="2.5" height="22" rx="1.25" fill="${p.primary}">` +
      `<animateTransform attributeName="transform" type="translate" values="${moves.join(";")}" keyTimes="${times}" calcMode="discrete" dur="${dur.toFixed(2)}s" fill="freeze"/>` +
      `<animate attributeName="opacity" values="1;0" calcMode="discrete" dur="1s" begin="${dur.toFixed(2)}s" repeatCount="indefinite"/>` +
      `</rect>`,
  );
  return [out.join(""), ""];
}

// About
export function about(ctx: Ctx) {
  const { c, p, i } = ctx;
  const row = 54;
  const h = 92 + row * c.about.items.length;
  const b = [`<rect width="${W}" height="${h}" rx="32" fill="${p.surfaceContainerLow}"/>`];
  b.push(sectionTitle(28, 26, c.about.title, "favorite", ctx));
  c.about.items.forEach((item, n) => {
    const y = 86 + n * row;
    const mid = y + (row - 8) / 2;
    b.push(`<g class="up" style="animation-delay:${(0.15 + n * 0.1).toFixed(2)}s">`);
    b.push(`<rect x="28" y="${y}" width="${W - 56}" height="${row - 8}" rx="16" fill="${p.surfaceContainerHigh}"/>`);
    b.push(`<circle cx="54" cy="${mid}" r="15" fill="${p.secondaryContainer}"/>`);
    b.push(icon(i, item.icon, 45, mid - 9, 18, p.onSecondaryContainer));
    b.push(txt(82, mid + 6, fit(item.label, 17, W - 130, 500), 17, p.onSurface, { weight: 500 }));
    b.push("</g>");
  });
  return svg(W, h, b.join(""), c.about.title, c.motion);
}

// Stack
export function stack(ctx: Ctx) {
  const { c, p, i } = ctx;
  let y = 86;
  let d = 0.1;
  const groups: string[] = [];
  for (const group of c.stack.groups) {
    if (group.title) groups.push(txt(28, y + 14, group.title.toUpperCase(), 12, p.onSurfaceVariant, { weight: 600, cls: "fade", delay: d, extra: ' letter-spacing="1.4"' }));
    let x = 28;
    let cy = group.title ? y + 26 : y;
    for (const item of group.items) {
      const [, w] = chip(i, p, 0, 0, item.label, { icon: item.icon });
      if (x + w > W - 28) {
        x = 28;
        cy += 44;
      }
      groups.push(chip(i, p, x, cy, item.label, { icon: item.icon, delay: d })[0]);
      x += w + 8;
      d += 0.05;
    }
    y = cy + 36 + 22;
  }
  const h = y + 6;
  const b = [`<rect width="${W}" height="${h}" rx="32" fill="${p.surfaceContainerLow}"/>`];
  b.push(sectionTitle(28, 26, c.stack.title, "code", ctx));
  b.push(...groups);
  return svg(W, h, b.join(""), c.stack.title, c.motion);
}

// Projects
function pickIcon(repo: Repo) {
  const hay = ` ${repo.name} ${repo.text} ${repo.topics.join(" ")} `.toLowerCase().replace(/-/g, " ");
  for (const [keys, name] of ICON_RULES) if (keys.some((k) => hay.includes(k))) return name;
  return (repo.language && LANG_ICONS[repo.language]) || "code";
}

function repoTags(repo: Repo) {
  const tags = repo.language ? [repo.language] : [];
  const hay = `${repo.text} ${repo.topics.join(" ")}`.toLowerCase();
  if (hay.includes("winui") && !tags.includes("WinUI 3")) tags.push("WinUI 3");
  return tags;
}

export function projectList(c: Config, d: Data) {
  if (c.projects.source === "manual") {
    return c.projects.repos.map((n) => d.all.find((r) => r.name === n)).filter((r): r is Repo => !!r);
  }
  return d.pins;
}

export function projectView(c: Config, repo: Repo, index: number) {
  const o = c.projects.overrides[repo.name] ?? {};
  return {
    title: repo.name,
    text: o.text || repo.text || c.projects.empty,
    icon: o.icon || pickIcon(repo),
    shape: o.shape || CARD_SHAPES[index % CARD_SHAPES.length],
    tags: repoTags(repo),
  };
}

export function card(ctx: Ctx, repo: Repo, index: number) {
  const { c, p, i } = ctx;
  const w = 412;
  const h = 232;
  const d0 = 0.08 * index;
  const v = projectView(c, repo, index);
  const b = [`<rect width="${w}" height="${h}" rx="28" fill="${p.surfaceContainerHigh}"/>`];
  b.push(pop(`<path class="spin" d="${shape(v.shape, 52, 52, 30)}" fill="${p.primaryContainer}"/>`, d0));
  b.push(pop(icon(i, v.icon, 39, 39, 26, p.onPrimaryContainer), d0 + 0.08));
  b.push(`<circle cx="${w - 40}" cy="40" r="18" fill="${p.surfaceContainerHighest}"/>`);
  b.push(icon(i, "arrow_outward", w - 50, 30, 20, p.onSurfaceVariant));
  const tx = 24;
  const forkW = repo.fork ? textWidth(c.projects.fork, 12, 600) + 28 : 0;
  const title = fit(v.title, 23, w - 48 - forkW, 650);
  b.push(txt(tx, 116, title, 23, p.onSurface, { weight: 650, cls: "up", delay: d0 + 0.1 }));
  if (repo.fork) {
    const fw = textWidth(c.projects.fork, 12, 600) + 18;
    const fx = tx + textWidth(title, 23, 650) + 10;
    b.push(pop(
      `<rect x="${fx.toFixed(1)}" y="98" width="${fw.toFixed(1)}" height="22" rx="11" fill="${p.tertiaryContainer}"/>` +
        txt(fx + fw / 2, 113, c.projects.fork, 12, p.onTertiaryContainer, { weight: 600, anchor: "middle" }),
      d0 + 0.25,
    ));
  }
  wrap(v.text, 15, w - 48, 400, 2).forEach((line, n) => {
    b.push(txt(tx, 142 + n * 21, line, 15, p.onSurfaceVariant, { cls: "up", delay: d0 + 0.18 + n * 0.05 }));
  });
  let x = tx;
  v.tags.forEach((tag, n) => {
    const [g, cw] = chip(i, p, x, 184, tag, { delay: d0 + 0.3 + n * 0.06, h: 28, size: 13, style: "tonal" });
    b.push(g);
    x += cw + 6;
  });
  const label = String(repo.stars);
  const sw = textWidth(label, 14, 600);
  b.push(pop(
    icon(i, "star", w - 24 - sw - 22, 188, 19, p.primary) + txt(w - 24, 203, label, 14, p.onSurfaceVariant, { weight: 600, anchor: "end" }),
    d0 + 0.4,
  ));
  return svg(w, h, b.join(""), v.title, c.motion);
}

// Stats
export function stats(ctx: Ctx) {
  const { c, d, p, i } = ctx;
  const s = c.stats;
  const langs = s.showLanguages ? d.languages : [];
  const total = langs.reduce((a, [, v]) => a + v, 0) || 1;
  const legend: [number, number, string][] = [];
  let x = 28;
  let row = 0;
  for (const [name, v] of langs) {
    const label = `${name} ${((100 * v) / total).toFixed(1)}%`.replace(".0%", "%");
    const lw = 15 + textWidth(label, 14, 500) + 18;
    if (x + lw > W - 28) {
      x = 28;
      row++;
    }
    legend.push([x, row, label]);
    x += lw;
  }
  const h = s.showLanguages && langs.length ? 400 + row * 26 : 310;
  const b = [`<rect width="${W}" height="${h}" rx="32" fill="${p.surfaceContainerLow}"/>`];
  b.push(sectionTitle(28, 26, s.title, "monitoring", ctx));
  const tiles: [string, number, string, ShapeName][] = [
    ["star", d.stars, s.stars, "cookie"],
    ["commit", d.contributions, s.contributions, "clover"],
    ["book_2", d.repos, s.repos, "sunny"],
    ["group", d.followers, s.followers, "flower"],
  ];
  tiles.forEach(([ic, value, label, sh], n) => {
    const tx = 28 + (n % 2) * 196;
    const ty = 86 + Math.floor(n / 2) * 106;
    b.push(`<g class="up" style="animation-delay:${(0.1 + n * 0.08).toFixed(2)}s">`);
    b.push(`<rect x="${tx}" y="${ty}" width="184" height="96" rx="24" fill="${p.surfaceContainerHigh}"/>`);
    b.push(`<path d="${shape(sh, tx + 34, ty + 34, 18)}" fill="${p.primaryContainer}"/>`);
    b.push(icon(i, ic, tx + 24, ty + 24, 20, p.onPrimaryContainer));
    b.push(txt(tx + 62, ty + 46, String(value), 30, p.onSurface, { weight: 700 }));
    b.push(txt(tx + 20, ty + 78, fit(label, 14, 152, 500), 14, p.onSurfaceVariant, { weight: 500 }));
    b.push("</g>");
  });
  const rx = 432;
  b.push(txt(rx, 100, s.calendar, 14, p.onSurfaceVariant, { weight: 600, cls: "fade", delay: 0.1 }));
  const gap = 6;
  const cw = (W - 28 - rx - gap * 6) / 7;
  const ch = 46;
  [...(s.weekdays + "       ").slice(0, 7)].forEach((letter, n) => {
    b.push(txt(rx + n * (cw + gap) + cw / 2, 124, letter, 12, p.onSurfaceVariant, { weight: 600, cls: "fade", delay: 0.15, anchor: "middle" }));
  });
  const base = p.surfaceContainerHighest;
  const levels = [base, mix(base, p.primary, 0.4), mix(base, p.primary, 0.65), mix(base, p.primary, 0.85), p.primary];
  const peak = Math.max(1, ...d.days.flat().map((x) => x?.c ?? 0));
  d.days.forEach((wk, wi) => {
    wk.forEach((day, di) => {
      const x = rx + di * (cw + gap);
      const y = 136 + wi * (ch + 6);
      const delay = 0.2 + (wi * 7 + di) * 0.025;
      if (!day) {
        b.push(`<rect class="pop" style="animation-delay:${delay.toFixed(3)}s" x="${(x + 0.75).toFixed(1)}" y="${y + 0.75}" width="${(cw - 1.5).toFixed(1)}" height="${ch - 1.5}" rx="14" fill="none" stroke="${p.outlineVariant}" stroke-width="1.5" stroke-dasharray="4 4"/>`);
        return;
      }
      const lvl = day.c === 0 ? 0 : Math.min(4, 1 + Math.floor((3 * day.c) / peak + 0.5));
      const fg = lvl >= 3 ? p.onPrimary : p.onSurfaceVariant;
      let cell = `<rect x="${x.toFixed(1)}" y="${y}" width="${cw.toFixed(1)}" height="${ch}" rx="14" fill="${levels[lvl]}"/>`;
      if (day.today) cell += `<rect x="${(x - 3).toFixed(1)}" y="${y - 3}" width="${(cw + 6).toFixed(1)}" height="${ch + 6}" rx="17" fill="none" stroke="${p.primary}" stroke-width="2"/>`;
      cell += txt(x + cw / 2, y + ch / 2 + 5, String(day.day), 14, fg, { weight: 600, anchor: "middle" });
      b.push(`<g class="pop" style="animation-delay:${delay.toFixed(3)}s">${cell}</g>`);
    });
  });
  if (s.showLanguages && langs.length) {
    const ly = 322;
    b.push(txt(28, ly, s.languages, 14, p.onSurfaceVariant, { weight: 600, cls: "fade", delay: 0.3 }));
    const surf = p.surfaceContainerLow;
    const colors = [p.primary, p.tertiary, p.secondary, mix(p.primary, surf, 0.45), mix(p.tertiary, surf, 0.45), mix(p.secondary, surf, 0.45), p.outline, p.outlineVariant];
    const bw = W - 56;
    const gaps = 4 * (langs.length - 1);
    const widths = langs.map(([, v]) => Math.max(8, ((bw - gaps) * v) / total));
    const k = (bw - gaps) / (widths.reduce((a, v) => a + v, 0) || 1);
    let sx = 28;
    const segs = widths.map((sw, n) => {
      const r = `<rect x="${sx.toFixed(1)}" y="${ly + 12}" width="${(sw * k).toFixed(1)}" height="14" rx="7" fill="${colors[n % colors.length]}"/>`;
      sx += sw * k + 4;
      return r;
    });
    b.push(`<g class="grow" style="animation-delay:.4s">${segs.join("")}</g>`);
    legend.forEach(([lx, lrow, label], n) => {
      const ly2 = ly + 50 + lrow * 26;
      b.push(pop(`<circle cx="${lx + 5}" cy="${ly2 - 5}" r="5" fill="${colors[n % colors.length]}"/>` + txt(lx + 15, ly2, label, 14, p.onSurfaceVariant, { weight: 500 }), 0.6 + n * 0.06, "fade"));
    });
  }
  return svg(W, h, b.join(""), s.title, c.motion);
}

// Authored code statistics
export function authoredStats(ctx: Ctx) {
  const { c, d, p } = ctx;
  const s = c.authoredStats;
  const a = d.authored;
  const h = 348;
  const b = [`<rect width="${W}" height="${h}" rx="32" fill="${p.surfaceContainerLow}"/>`];
  b.push(sectionTitle(28, 26, s.title, "code", ctx));
  if (!a || !a.commits || !a.languages.length) {
    b.push(txt(W / 2, 184, s.noData, 18, p.onSurfaceVariant, { weight: 600, anchor: "middle" }));
    return svg(W, h, b.join(""), s.title, c.motion);
  }
  const langs = a.languages.slice(0, Math.max(1, s.topLanguages));
  const total = a.languages.reduce((sum, item) => sum + item.changed, 0) || 1;
  const colors = [p.primary, p.tertiary, p.secondary, mix(p.primary, p.surfaceContainerLow, .45), mix(p.tertiary, p.surfaceContainerLow, .45)];
  const radius = 58, circumference = 2 * Math.PI * radius;
  let offset = 0;
  b.push(`<circle cx="120" cy="176" r="${radius}" fill="none" stroke="${p.surfaceContainerHighest}" stroke-width="22"/>`);
  langs.forEach((item, index) => {
    const length = circumference * item.changed / total;
    b.push(`<circle class="grow" style="animation-delay:${(.12 + index * .07).toFixed(2)}s" cx="120" cy="176" r="${radius}" fill="none" stroke="${colors[index % colors.length]}" stroke-width="22" stroke-linecap="round" stroke-dasharray="${Math.max(0, length - 3).toFixed(2)} ${(circumference - length + 3).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}" transform="rotate(-90 120 176)"/>`);
    offset += length;
  });
  b.push(txt(120, 171, String(a.commits), 28, p.onSurface, { weight: 700, anchor: "middle" }));
  b.push(txt(120, 192, s.commits, 13, p.onSurfaceVariant, { weight: 600, anchor: "middle" }));
  const metrics: [number, string, string][] = [[a.repositoriesWithCommits, s.repositories, "book_2"], [a.additions + a.deletions, s.changed, "difference"]];
  metrics.forEach(([value, label, iconName], index) => {
    const x = 224 + index * 188;
    b.push(`<rect x="${x}" y="74" width="172" height="82" rx="22" fill="${p.surfaceContainerHigh}"/>`);
    b.push(icon(ctx.i, iconName, x + 18, 94, 20, p.primary));
    b.push(txt(x + 48, 111, String(value), 24, p.onSurface, { weight: 700 }));
    b.push(txt(x + 18, 139, fit(label, 13, 136, 500), 13, p.onSurfaceVariant, { weight: 500 }));
  });
  b.push(txt(224, 188, s.languages, 14, p.onSurfaceVariant, { weight: 600 }));
  langs.forEach((item, index) => {
    const y = 214 + index * 24;
    const percent = `${Math.round(item.changed * 1000 / total) / 10}%`;
    b.push(`<circle cx="230" cy="${y - 5}" r="5" fill="${colors[index % colors.length]}"/>`);
    b.push(txt(242, y, fit(item.name, 14, 190, 500), 14, p.onSurfaceVariant, { weight: 500 }));
    b.push(txt(W - 28, y, percent, 14, p.onSurface, { weight: 700, anchor: "end" }));
  });
  if (a.partial) b.push(txt(28, 324, s.partial, 12, p.error, { weight: 700 }));
  return svg(W, h, b.join(""), s.title, c.motion);
}

// Streak
export function streak(ctx: Ctx) {
  const { c, d, p, i } = ctx;
  const s = c.streak;
  const h = 214;
  const b = [`<rect width="${W}" height="${h}" rx="32" fill="${p.surfaceContainerLow}"/>`];
  b.push(sectionTitle(28, 26, s.title, "local_fire_department", ctx));
  const tw = (W - 56 - 12) / 2;
  const tiles: [number, string, ShapeName, string][] = [
    [d.streak.current, s.current, "sunny", "local_fire_department"],
    [d.streak.longest, s.longest, "flower", "trophy"],
  ];
  tiles.forEach(([value, label, sh, ic], n) => {
    const tx = 28 + n * (tw + 12);
    const ty = 86;
    b.push(`<g class="up" style="animation-delay:${(0.1 + n * 0.1).toFixed(2)}s">`);
    b.push(`<rect x="${tx}" y="${ty}" width="${tw}" height="100" rx="26" fill="${n ? p.surfaceContainerHigh : p.primaryContainer}"/>`);
    b.push(pop(`<path class="${n ? "spin-r" : "spin"}" d="${shape(sh, tx + 52, ty + 50, 30)}" fill="${n ? p.secondaryContainer : p.primary}"/>`, 0.2 + n * 0.1));
    b.push(icon(i, ic, tx + 38, ty + 36, 28, n ? p.onSecondaryContainer : p.onPrimary));
    const num = String(value);
    const fg = n ? p.onSurface : p.onPrimaryContainer;
    b.push(txt(tx + 100, ty + 56, num, 40, fg, { weight: 700 }));
    b.push(txt(tx + 108 + textWidth(num, 40, 700), ty + 56, s.days, 16, fg, { weight: 600 }));
    b.push(txt(tx + 100, ty + 80, fit(label, 15, tw - 120, 500), 15, n ? p.onSurfaceVariant : p.onPrimaryContainer, { weight: 500 }));
    b.push("</g>");
  });
  return svg(W, h, b.join(""), s.title, c.motion);
}

// Socials
function luminance(hex: string) {
  const [r, g, b] = [0, 2, 4].map((k) => parseInt(hex.slice(k, k + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function socialLabel(icons: Icons, item: Social) {
  if (item.icon.startsWith("brand:")) {
    const b = icons.brand[item.icon.slice(6)];
    if (b) return b.t;
  }
  try {
    return new URL(item.url).hostname.replace(/^www\./, "");
  } catch {
    return item.url;
  }
}

function socialColors(p: Palette, icons: Icons, item: Social, fill: Config["socials"]["fill"]) {
  if (fill === "brand") {
    const hex = item.icon.startsWith("brand:") ? icons.brand[item.icon.slice(6)]?.c : undefined;
    if (hex) return { bg: `#${hex}`, fg: luminance(hex) > 0.45 ? "#1b1b1f" : "#ffffff", stroke: "" };
    return { bg: p.primary, fg: p.onPrimary, stroke: "" };
  }
  if (fill === "filled") return { bg: p.primary, fg: p.onPrimary, stroke: "" };
  if (fill === "outlined") return { bg: "none", fg: p.onSurfaceVariant, stroke: p.outline };
  return { bg: p.secondaryContainer, fg: p.onSecondaryContainer, stroke: "" };
}

interface Piece {
  body: string;
  w: number;
  h: number;
  title: string;
}

function socialPiece({ c, p, i }: Ctx, item: Social, n: number): Piece {
  const st = c.socials;
  const col = socialColors(p, i, item, st.fill);
  const stroke = col.stroke ? ` stroke="${col.stroke}" stroke-width="1.5"` : "";
  const delay = n * 0.06;
  if (st.variant === "chip") {
    const label = socialLabel(i, item);
    const h = 48;
    const w = 18 + 24 + 10 + textWidth(label, 16, 600) + 20;
    const rx = st.shape === "soft" ? 16 : 24;
    const body = pop(
      `<rect x="1" y="1" width="${(w - 2).toFixed(1)}" height="${h - 2}" rx="${rx}" fill="${col.bg}"${stroke}/>` +
        icon(i, item.icon, 18, 12, 24, col.fg) +
        txt(52, 30, label, 16, col.fg, { weight: 600 }),
      delay,
    );
    return { body, w, h, title: label };
  }
  const kind = st.shape ?? (n % 2 ? "cookie" : "cookie12");
  const body =
    `<path class="pop" style="animation-delay:${delay.toFixed(2)}s" d="${shape(kind, 28, 28, 25.5)}" fill="${col.bg}"${stroke}/>` +
    pop(icon(i, item.icon, 15, 15, 26, col.fg), delay + 0.05);
  return { body, w: 56, h: 56, title: item.url };
}

function buttonPiece({ p, i }: Ctx, btn: LinkButton, n: number): Piece {
  const h = 56;
  const size = 17;
  const iw = btn.icon ? 32 : 0;
  const w = 56 + iw + textWidth(btn.label, size, 600);
  const [bg, fg] = btn.style === "filled" ? [p.primary, p.onPrimary] : [p.secondaryContainer, p.onSecondaryContainer];
  let body = `<rect width="${w.toFixed(1)}" height="${h}" rx="28" fill="${bg}"/>`;
  if (btn.icon) body += icon(i, btn.icon, 28, (h - 22) / 2, 22, fg);
  body += txt(28 + iw, h / 2 + 6, btn.label, size, fg, { weight: 600 });
  return { body: pop(body, n * 0.08), w, h, title: btn.label };
}

// Rows
const PAD = 20;
const GAP = 8;
const CAP = 28;

export function rowFits(pieces: { w: number }[]) {
  return pieces.length > 0 && pieces.reduce((a, x) => a + x.w + GAP, 0) + CAP * 2 <= W;
}

function row(ctx: Ctx, prefix: string, pieces: Piece[], card: boolean) {
  const { c, p } = ctx;
  const files: Record<string, string> = {};
  if (!card || !rowFits(pieces)) {
    pieces.forEach((x, n) => (files[`${prefix}-${n + 1}`] = svg(x.w, x.h, x.body, x.title, c.motion)));
    return files;
  }
  const h = Math.max(...pieces.map((x) => x.h)) + PAD * 2;
  const cap = (W - pieces.reduce((a, x) => a + x.w + GAP, 0)) / 2;
  const bg = p.surfaceContainerLow;
  files[`${prefix}-l`] = svg(cap, h, `<rect width="${(cap + 40).toFixed(1)}" height="${h}" rx="32" fill="${bg}"/>`, "", c.motion);
  files[`${prefix}-r`] = svg(cap, h, `<rect x="-40" width="${(cap + 40).toFixed(1)}" height="${h}" rx="32" fill="${bg}"/>`, "", c.motion);
  pieces.forEach((x, n) => {
    const w = x.w + GAP;
    files[`${prefix}-${n + 1}`] = svg(w, h, `<rect width="${w + 1}" height="${h}" fill="${bg}"/><g transform="translate(${GAP / 2} ${(h - x.h) / 2})">${x.body}</g>`, x.title, c.motion);
  });
  return files;
}

export function socials(ctx: Ctx) {
  const c = ctx.c;
  return row(ctx, "social", c.socials.items.map((s, n) => socialPiece(ctx, s, n)), !!c.socials.card);
}

export function buttons(ctx: Ctx) {
  const c = ctx.c;
  return row(ctx, "button", c.buttons.items.map((b, n) => buttonPiece(ctx, b, n)), !!c.buttons.card);
}

export function wave({ c, p }: Ctx) {
  const h = 28;
  const amp = 5;
  const length = 48;
  const pts: string[] = [];
  for (let x = 0; x <= W + length * 2; x += 4) pts.push(`${x} ${(h / 2 + amp * Math.sin((2 * Math.PI * x) / length)).toFixed(1)}`);
  const body =
    `<clipPath id="w"><rect x="0" y="0" width="${W}" height="${h}"/></clipPath><g clip-path="url(#w)">` +
    `<path class="wave" d="M${pts.join(" L")}" fill="none" stroke="${p.primary}" stroke-width="5" stroke-linecap="round"/></g>`;
  return svg(W, h, body, "divider", c.motion);
}

export function credit({ p }: Ctx) {
  const label = "Made with Expressive Profile";
  const size = 12;
  const w = textWidth(label, size, 500) + 4;
  return svg(w, 18, txt(2, 13, label, size, p.onSurfaceVariant, { weight: 500, extra: ' opacity=".7"' }), label, false);
}
