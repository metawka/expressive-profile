import { chip, esc, icon, mix, pop, shape, svg, typography } from "./kit";
import { bevel, engraving, lance, panel, plate } from "./chrome";
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

function sectionTitle(x: number, y: number, label: string, ic: string, { c, p, i }: Ctx, delay = 0) {
  const { txt, fit } = typography(c.skin);
  if (c.skin === "chrome") {
    return plate(x, y, 38, 38, p.surfaceContainerHigh, p.outlineVariant, 8) +
      icon(i, ic, x + 8, y + 8, 22, p.tertiary) +
      txt(x + 54, y + 28, fit(label, 28, W - x - 82, 700, "display"), 28, p.onSurface, { weight: 700, face: "display", cls: "up", delay });
  }
  const tile = `<path class="pop" style="animation-delay:${delay.toFixed(2)}s" d="${shape("cookie", x + 20, y + 20, 20)}" fill="${p.primaryContainer}"/>`;
  const glyph = pop(icon(i, ic, x + 9, y + 9, 22, p.onPrimaryContainer), delay + 0.05);
  return tile + glyph + txt(x + 54, y + 28, fit(label, 24, W - x - 82, 600), 24, p.onSurface, { weight: 600, cls: "up", delay });
}

// Hero
export function hero(ctx: Ctx, avatar: string | null) {
  const { c, p, i } = ctx;
  const chrome = c.skin === "chrome";
  const { txt, wrap, textWidth } = typography(c.skin);
  const h = 300;
  const b = [chrome ? `<clipPath id="card"><path d="${bevel(0, 0, W, h, 18)}"/></clipPath>` : `<clipPath id="card"><rect width="${W}" height="${h}" rx="32"/></clipPath>`];
  b.push(chrome ? panel(W, h, p) : `<rect width="${W}" height="${h}" rx="32" fill="${p.surfaceContainer}"/>`);
  b.push('<g clip-path="url(#card)">');
  if (chrome) b.push(engraving(p));
  else {
  b.push(`<path class="spin" d="${shape("flower", 780, 30, 150)}" fill="${p.primaryContainer}"/>`);
  b.push(`<path class="bob" d="${shape("clover", 690, 292, 62)}" fill="${p.tertiaryContainer}"/>`);
  b.push(`<path class="spin-r" d="${shape("sunny", 812, 236, 34)}" fill="${p.secondaryContainer}"/>`);
  }
  b.push("</g>");
  const cx = 150;
  const cy = 150;
  const frame = c.hero.avatarShape;
  if (chrome) {
    b.push(plate(40, 40, 220, 220, p.surfaceContainer, "url(#metal)", 24));
    b.push(`<path d="M32 88V52L52 32H88M212 268H248L268 248V212" fill="none" stroke="${p.outline}" stroke-width="2"/>`);
    b.push(lance(150, 37, 17, p.primary) + lance(150, 263, 17, p.primary));
  } else b.push(`<path class="spin" d="${shape("sunny", cx, cy, 112)}" fill="${p.primary}" opacity=".9"/>`);
  b.push(`<clipPath id="ava"><path d="${chrome ? bevel(52, 52, 196, 196, 18) : shape(frame, cx, cy, 98)}"/></clipPath>`);
  if (!chrome) b.push(`<path d="${shape(frame, cx, cy, 102)}" fill="${p.surfaceContainer}"/>`);
  if (avatar) {
    b.push(`<g class="fade"><image href="${esc(avatar)}" x="${cx - 100}" y="${cy - 100}" width="200" height="200" clip-path="url(#ava)" preserveAspectRatio="xMidYMid slice"/></g>`);
  } else {
    b.push(`<path d="${chrome ? bevel(52, 52, 196, 196, 18) : shape(frame, cx, cy, 98)}" fill="${p.primaryContainer}"/>`);
    b.push(icon(i, "person", cx - 44, cy - 44, 88, p.onPrimaryContainer));
  }
  const x = 294;
  const name = c.hero.name || c.login;
  const room = W - x - 40;
  const size = Math.min(chrome ? 82 : 68, room / Math.max(1, textWidth(name, 1, 700, "display")));
  b.push(txt(x, 92, c.hero.greeting, 22, p.onSurfaceVariant, { weight: 500, cls: "up", delay: 0.1 }));
  b.push(pop(txt(x - 3, 156, name, size, p.onSurface, { cls: "wght", ...(chrome ? { weight: 700, face: "display" as const } : {}) }), 0.2, "up"));
  const lines = wrap(c.hero.subtitle, 19, 430, 400, 2);
  let extra = "";
  if (c.hero.typing && c.motion && lines.join("")) {
    const [body, css] = typing(lines, x, ctx);
    if (chrome) {
      b.push(`<g class="typed">${body}</g><g class="type-static">` +
        lines.map((line, n) => txt(x, 194 + n * 26, line, 19, p.onSurfaceVariant)).join("") + "</g>");
      extra = css + ".type-static{display:none}@media(prefers-reduced-motion:reduce){.typed{display:none}.type-static{display:inline}}";
    } else {
      b.push(body);
      extra = css;
    }
  } else lines.forEach((line, n) => {
    b.push(txt(x, 194 + n * 26, line, 19, p.onSurfaceVariant, { cls: "up", delay: 0.35 + n * 0.08 }));
  });
  let cx2 = x;
  c.hero.chips.forEach((item, n) => {
    const [g, w] = chip(i, p, cx2, 236, item.label, { icon: item.icon, delay: 0.6 + n * 0.1, style: "tonal" }, c.skin);
    if (cx2 + w > W - 24) return;
    b.push(g);
    cx2 += w + 8;
  });
  return svg(W, h, b.join(""), `${c.hero.greeting} ${name}`, c.motion, extra, c.skin);
}

function typing(lines: string[], x: number, { c, p }: Ctx): [string, string] {
  const { txt, textWidth } = typography(c.skin);
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
  const { txt, fit } = typography(c.skin);
  const row = 54;
  const h = 92 + row * c.about.items.length;
  const b = [c.skin === "chrome" ? panel(W, h, p) : `<rect width="${W}" height="${h}" rx="32" fill="${p.surfaceContainerLow}"/>`];
  b.push(sectionTitle(28, 26, c.about.title, "favorite", ctx));
  c.about.items.forEach((item, n) => {
    const y = 86 + n * row;
    const mid = y + (row - 8) / 2;
    b.push(`<g class="up" style="animation-delay:${(0.15 + n * 0.1).toFixed(2)}s">`);
    b.push(c.skin === "chrome"
      ? `<path d="M28 ${y + row - 8}H${W - 28}" stroke="${p.outlineVariant}"/>`
      : `<rect x="28" y="${y}" width="${W - 56}" height="${row - 8}" rx="16" fill="${p.surfaceContainerHigh}"/>`);
    if (c.skin !== "chrome") b.push(`<circle cx="54" cy="${mid}" r="15" fill="${p.secondaryContainer}"/>`);
    b.push(icon(i, item.icon, 45, mid - 9, 18, p.onSecondaryContainer));
    b.push(txt(82, mid + 6, fit(item.label, 17, W - 130, 500), 17, p.onSurface, { weight: 500 }));
    b.push("</g>");
  });
  return svg(W, h, b.join(""), c.about.title, c.motion, "", c.skin);
}

// Stack
export function stack(ctx: Ctx) {
  const { c, p, i } = ctx;
  const { txt } = typography(c.skin);
  let y = 86;
  let d = 0.1;
  const groups: string[] = [];
  for (const group of c.stack.groups) {
    if (group.title) groups.push(txt(28, y + 14, group.title.toUpperCase(), 12, p.onSurfaceVariant, { weight: 600, cls: "fade", delay: d, extra: ' letter-spacing="1.4"', face: "mono" }));
    let x = 28;
    let cy = group.title ? y + 26 : y;
    for (const item of group.items) {
      const [, w] = chip(i, p, 0, 0, item.label, { icon: item.icon }, c.skin);
      if (x + w > W - 28) {
        x = 28;
        cy += 44;
      }
      groups.push(chip(i, p, x, cy, item.label, { icon: item.icon, delay: d }, c.skin)[0]);
      x += w + 8;
      d += 0.05;
    }
    y = cy + 36 + 22;
  }
  const h = y + 6;
  const b = [c.skin === "chrome" ? panel(W, h, p) : `<rect width="${W}" height="${h}" rx="32" fill="${p.surfaceContainerLow}"/>`];
  b.push(sectionTitle(28, 26, c.stack.title, "code", ctx));
  b.push(...groups);
  return svg(W, h, b.join(""), c.stack.title, c.motion, "", c.skin);
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
  const chrome = c.skin === "chrome";
  const { txt, fit, wrap, textWidth } = typography(c.skin);
  const w = 412;
  const h = 232;
  const d0 = 0.08 * index;
  const v = projectView(c, repo, index);
  const b = [chrome ? panel(w, h, p) : `<rect width="${w}" height="${h}" rx="28" fill="${p.surfaceContainerHigh}"/>`];
  b.push(pop(chrome ? plate(24, 24, 56, 56, p.primaryContainer, p.outlineVariant, 12) : `<path class="spin" d="${shape(v.shape, 52, 52, 30)}" fill="${p.primaryContainer}"/>`, d0));
  b.push(pop(icon(i, v.icon, 39, 39, 26, p.onPrimaryContainer), d0 + 0.08));
  if (!chrome) b.push(`<circle cx="${w - 40}" cy="40" r="18" fill="${p.surfaceContainerHighest}"/>`);
  else b.push(`<path d="M96 52H${w - 80}" stroke="${p.outlineVariant}"/>`);
  b.push(icon(i, "arrow_outward", w - 50, 30, 20, p.onSurfaceVariant));
  const tx = 24;
  const forkW = repo.fork ? textWidth(c.projects.fork, 12, 600) + 28 : 0;
  const titleSize = chrome ? 28 : 23;
  const title = fit(v.title, titleSize, w - 48 - forkW, chrome ? 700 : 650, "display");
  b.push(txt(tx, 116, title, titleSize, p.onSurface, { weight: chrome ? 700 : 650, face: "display", cls: "up", delay: d0 + 0.1 }));
  if (repo.fork) {
    const fw = textWidth(c.projects.fork, 12, 600) + 18;
    const fx = tx + textWidth(title, titleSize, chrome ? 700 : 650, "display") + 10;
    b.push(pop(
      (chrome ? plate(fx, 98, fw, 22, p.tertiaryContainer, p.outlineVariant, 4) : `<rect x="${fx.toFixed(1)}" y="98" width="${fw.toFixed(1)}" height="22" rx="11" fill="${p.tertiaryContainer}"/>`) +
        txt(fx + fw / 2, 113, c.projects.fork, 12, p.onTertiaryContainer, { weight: 600, anchor: "middle" }),
      d0 + 0.25,
    ));
  }
  wrap(v.text, 15, w - 48, 400, 2).forEach((line, n) => {
    b.push(txt(tx, 142 + n * 21, line, 15, p.onSurfaceVariant, { cls: "up", delay: d0 + 0.18 + n * 0.05 }));
  });
  let x = tx;
  v.tags.forEach((tag, n) => {
    const [g, cw] = chip(i, p, x, 184, tag, { delay: d0 + 0.3 + n * 0.06, h: 28, size: 13, style: "tonal" }, c.skin);
    b.push(g);
    x += cw + 6;
  });
  const label = String(repo.stars);
  const sw = textWidth(label, 14, 600);
  b.push(pop(
    icon(i, "star", w - 24 - sw - 22, 188, 19, p.primary) + txt(w - 24, 203, label, 14, p.onSurfaceVariant, { weight: 600, anchor: "end" }),
    d0 + 0.4,
  ));
  return svg(w, h, b.join(""), v.title, c.motion, "", c.skin);
}

// Stats
export function stats(ctx: Ctx) {
  const { c, d, p, i } = ctx;
  const chrome = c.skin === "chrome";
  const { txt, fit, textWidth } = typography(c.skin);
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
  const b = [chrome ? panel(W, h, p) : `<rect width="${W}" height="${h}" rx="32" fill="${p.surfaceContainerLow}"/>`];
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
    b.push(chrome ? plate(tx, ty, 184, 96, p.surfaceContainerHigh, p.outlineVariant, 10) : `<rect x="${tx}" y="${ty}" width="184" height="96" rx="24" fill="${p.surfaceContainerHigh}"/>`);
    if (!chrome) b.push(`<path d="${shape(sh, tx + 34, ty + 34, 18)}" fill="${p.primaryContainer}"/>`);
    b.push(icon(i, ic, tx + 24, ty + 24, 20, p.onPrimaryContainer));
    b.push(txt(tx + 62, ty + 46, String(value), 30, p.onSurface, { weight: 700, face: "display" }));
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
        b.push(`<rect class="pop" style="animation-delay:${delay.toFixed(3)}s" x="${(x + 0.75).toFixed(1)}" y="${y + 0.75}" width="${(cw - 1.5).toFixed(1)}" height="${ch - 1.5}" rx="${chrome ? 2 : 14}" fill="none" stroke="${p.outlineVariant}" stroke-width="1.5" stroke-dasharray="4 4"/>`);
        return;
      }
      const lvl = day.c === 0 ? 0 : Math.min(4, 1 + Math.floor((3 * day.c) / peak + 0.5));
      const fg = chrome ? (luminance(levels[lvl].slice(1)) > 0.179 ? "#000000" : "#ffffff") : lvl >= 3 ? p.onPrimary : p.onSurfaceVariant;
      let cell = `<rect x="${x.toFixed(1)}" y="${y}" width="${cw.toFixed(1)}" height="${ch}" rx="${chrome ? 2 : 14}" fill="${levels[lvl]}"/>`;
      if (day.today) cell += `<rect x="${(x - 3).toFixed(1)}" y="${y - 3}" width="${(cw + 6).toFixed(1)}" height="${ch + 6}" rx="${chrome ? 3 : 17}" fill="none" stroke="${chrome ? p.tertiary : p.primary}" stroke-width="2"/>`;
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
      const r = `<rect x="${sx.toFixed(1)}" y="${ly + 12}" width="${(sw * k).toFixed(1)}" height="14" rx="${chrome ? 0 : 7}" fill="${colors[n % colors.length]}"/>`;
      sx += sw * k + 4;
      return r;
    });
    b.push(`<g class="grow" style="animation-delay:.4s">${segs.join("")}</g>`);
    legend.forEach(([lx, lrow, label], n) => {
      const ly2 = ly + 50 + lrow * 26;
      b.push(pop(`<circle cx="${lx + 5}" cy="${ly2 - 5}" r="5" fill="${colors[n % colors.length]}"/>` + txt(lx + 15, ly2, label, 14, p.onSurfaceVariant, { weight: 500 }), 0.6 + n * 0.06, "fade"));
    });
  }
  return svg(W, h, b.join(""), s.title, c.motion, "", c.skin);
}

// Streak
export function streak(ctx: Ctx) {
  const { c, d, p, i } = ctx;
  const chrome = c.skin === "chrome";
  const { txt, fit, textWidth } = typography(c.skin);
  const s = c.streak;
  const h = 214;
  const b = [chrome ? panel(W, h, p) : `<rect width="${W}" height="${h}" rx="32" fill="${p.surfaceContainerLow}"/>`];
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
    b.push(chrome ? plate(tx, ty, tw, 100, n ? p.surfaceContainerHigh : p.primaryContainer, p.outlineVariant, 12) : `<rect x="${tx}" y="${ty}" width="${tw}" height="100" rx="26" fill="${n ? p.surfaceContainerHigh : p.primaryContainer}"/>`);
    b.push(pop(chrome ? plate(tx + 24, ty + 22, 56, 56, n ? p.secondaryContainer : p.primary, p.outline, 12) : `<path class="${n ? "spin-r" : "spin"}" d="${shape(sh, tx + 52, ty + 50, 30)}" fill="${n ? p.secondaryContainer : p.primary}"/>`, 0.2 + n * 0.1));
    b.push(icon(i, ic, tx + 38, ty + 36, 28, n ? p.onSecondaryContainer : p.onPrimary));
    const num = String(value);
    const fg = n ? p.onSurface : p.onPrimaryContainer;
    b.push(txt(tx + 100, ty + 56, num, 40, fg, { weight: 700, face: "display" }));
    b.push(txt(tx + 108 + textWidth(num, 40, 700, "display"), ty + 56, s.days, 16, fg, { weight: 600 }));
    b.push(txt(tx + 100, ty + 80, fit(label, 15, tw - 120, 500), 15, n ? p.onSurfaceVariant : p.onPrimaryContainer, { weight: 500 }));
    b.push("</g>");
  });
  return svg(W, h, b.join(""), s.title, c.motion, "", c.skin);
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
  const chrome = c.skin === "chrome";
  const { txt, textWidth } = typography(c.skin);
  const st = c.socials;
  const col = socialColors(p, i, item, chrome && st.fill === "tonal" ? "outlined" : st.fill);
  const stroke = col.stroke ? ` stroke="${col.stroke}" stroke-width="1.5"` : "";
  const delay = n * 0.06;
  if (st.variant === "chip") {
    const label = socialLabel(i, item);
    const h = 48;
    const w = 18 + 24 + 10 + textWidth(label, 16, 600) + 20;
    const rx = st.shape === "soft" ? 16 : 24;
    const body = pop(
      (chrome ? plate(1, 1, w - 2, h - 2, col.bg, col.stroke || col.bg, 8) : `<rect x="1" y="1" width="${(w - 2).toFixed(1)}" height="${h - 2}" rx="${rx}" fill="${col.bg}"${stroke}/>`) +
        icon(i, item.icon, 18, 12, 24, col.fg) +
        txt(52, 30, label, 16, col.fg, { weight: 600 }),
      delay,
    );
    return { body, w, h, title: label };
  }
  const kind = st.shape ?? (n % 2 ? "cookie" : "cookie12");
  const body =
    (chrome ? plate(2, 2, 52, 52, col.bg, col.stroke || col.bg, 10) : `<path class="pop" style="animation-delay:${delay.toFixed(2)}s" d="${shape(kind, 28, 28, 25.5)}" fill="${col.bg}"${stroke}/>` ) +
    pop(icon(i, item.icon, 15, 15, 26, col.fg), delay + 0.05);
  return { body, w: 56, h: 56, title: item.url };
}

function buttonPiece({ c, p, i }: Ctx, btn: LinkButton, n: number): Piece {
  const { txt, textWidth } = typography(c.skin);
  const h = 56;
  const size = 17;
  const iw = btn.icon ? 32 : 0;
  const w = 56 + iw + textWidth(btn.label, size, 600);
  const [bg, fg] = btn.style === "filled" ? [p.primary, p.onPrimary] : [p.secondaryContainer, p.onSecondaryContainer];
  let body = c.skin === "chrome" ? plate(0, 0, w, h, bg, p.outline, 10) : `<rect width="${w.toFixed(1)}" height="${h}" rx="28" fill="${bg}"/>`;
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
    pieces.forEach((x, n) => (files[`${prefix}-${n + 1}`] = svg(x.w, x.h, x.body, x.title, c.motion, "", c.skin)));
    return files;
  }
  const h = Math.max(...pieces.map((x) => x.h)) + PAD * 2;
  const cap = (W - pieces.reduce((a, x) => a + x.w + GAP, 0)) / 2;
  const bg = p.surfaceContainerLow;
  files[`${prefix}-l`] = svg(cap, h, c.skin === "chrome" ? plate(0, 0, cap + 40, h, bg, p.outlineVariant, 12) : `<rect width="${(cap + 40).toFixed(1)}" height="${h}" rx="32" fill="${bg}"/>`, "", c.motion, "", c.skin);
  files[`${prefix}-r`] = svg(cap, h, c.skin === "chrome" ? plate(-40, 0, cap + 40, h, bg, p.outlineVariant, 12) : `<rect x="-40" width="${(cap + 40).toFixed(1)}" height="${h}" rx="32" fill="${bg}"/>`, "", c.motion, "", c.skin);
  pieces.forEach((x, n) => {
    const w = x.w + GAP;
    const rules = c.skin === "chrome" ? `<path d="M0 .5H${w + 1}M0 ${h - 0.5}H${w + 1}" stroke="${p.outlineVariant}"/>` : "";
    files[`${prefix}-${n + 1}`] = svg(w, h, `<rect width="${w + 1}" height="${h}" fill="${bg}"/>${rules}<g transform="translate(${GAP / 2} ${(h - x.h) / 2})">${x.body}</g>`, x.title, c.motion, "", c.skin);
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
  if (c.skin === "chrome") {
    const body = `<path d="M24 14H386M454 14H816" stroke="${p.outline}"/>` +
      `<path d="M24 10V18M816 10V18M366 10L374 18M466 10L474 18" stroke="${p.outlineVariant}"/>` +
      lance(W / 2, h / 2, 14, p.primary);
    return svg(W, h, body, "divider", false, "", c.skin);
  }
  const amp = 5;
  const length = 48;
  const pts: string[] = [];
  for (let x = 0; x <= W + length * 2; x += 4) pts.push(`${x} ${(h / 2 + amp * Math.sin((2 * Math.PI * x) / length)).toFixed(1)}`);
  const body =
    `<clipPath id="w"><rect x="0" y="0" width="${W}" height="${h}"/></clipPath><g clip-path="url(#w)">` +
    `<path class="wave" d="M${pts.join(" L")}" fill="none" stroke="${p.primary}" stroke-width="5" stroke-linecap="round"/></g>`;
  return svg(W, h, body, "divider", c.motion);
}

export function credit({ c, p }: Ctx) {
  const { txt, textWidth } = typography(c.skin);
  const label = "Made with Expressive Profile";
  const size = 12;
  const w = textWidth(label, size, 500) + 4;
  return svg(w, 18, txt(2, 13, label, size, p.onSurfaceVariant, { weight: 500, extra: ' opacity=".7"' }), label, false, "", c.skin);
}
