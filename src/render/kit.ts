import metrics from "./metrics.json";
import chromeMetrics from "./chrome-metrics.json";
import { CHROME_FONTS, CHROME_LICENSES, FONT } from "./fontdata";
import { plate } from "./chrome";
import type { Icons, Palette, ShapeName, Skin } from "./types";

const METRICS = metrics as Record<string, Record<string, number>>;
type Face = "default" | "body" | "display" | "mono";
const CHROME_METRICS = chromeMetrics as Record<Exclude<Face, "default">, Record<string, Record<string, number>>>;

// Text
export function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
}

export function textWidth(s: string, size: number, weight = 400, face: Face = "default") {
  const key = [400, 500, 600, 700].reduce((a, b) => (Math.abs(b - weight) < Math.abs(a - weight) ? b : a));
  const table = (face === "default" ? METRICS : CHROME_METRICS[face])[String(key)];
  let w = 0;
  for (const c of s) w += table[c] ?? 0.55;
  return w * size;
}

export function wrap(s: string, size: number, width: number, weight = 400, lines = 2, face: Face = "default") {
  const out: string[] = [];
  let cur = "";
  for (const word of s.split(/\s+/).filter(Boolean)) {
    const trial = cur ? `${cur} ${word}` : word;
    if (textWidth(trial, size, weight, face) <= width || !cur) cur = trial;
    else {
      out.push(cur);
      cur = word;
    }
  }
  out.push(cur);
  if (out.length > lines) {
    out.length = lines;
    let last = out[lines - 1];
    while (textWidth(last + "…", size, weight, face) > width && last.includes(" ")) last = last.slice(0, last.lastIndexOf(" "));
    out[lines - 1] = last + "…";
  }
  return out;
}

export function fit(s: string, size: number, width: number, weight = 400, face: Face = "default") {
  if (textWidth(s, size, weight, face) <= width) return s;
  let t = s;
  while (t.length > 1 && textWidth(t + "…", size, weight, face) > width) t = t.slice(0, -1);
  return t.trimEnd() + "…";
}

export function typography(skin?: Skin) {
  const face: Face = skin === "chrome" ? "body" : "default";
  const resolve = (requested?: Face) => face === "default" ? face : requested ?? face;
  return {
    textWidth: (s: string, size: number, weight = 400, font?: Face) => textWidth(s, size, weight, resolve(font)),
    fit: (s: string, size: number, width: number, weight = 400, font?: Face) => fit(s, size, width, weight, resolve(font)),
    wrap: (s: string, size: number, width: number, weight = 400, lines = 2) => wrap(s, size, width, weight, lines, face),
    txt: (x: number, y: number, s: string, size: number, fill: string, o: Parameters<typeof txt>[5] = {}) =>
      txt(x, y, s, size, fill, { ...o, face: resolve(o.face) }),
  };
}

export function mix(a: string, b: string, t: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return "#" + pa.map((x, i) => Math.round(x + (pb[i] - x) * t).toString(16).padStart(2, "0")).join("");
}

// Shapes
export const SHAPE_PARAMS: Record<ShapeName, [number, number, number]> = {
  cookie: [9, 0.07, 1],
  cookie12: [12, 0.05, 1],
  clover: [4, 0.2, 1],
  sunny: [8, 0.1, 2.2],
  flower: [8, 0.16, 1],
  pill: [2, 0, 1],
  soft: [4, 0.05, 0.6],
  gem: [6, 0.07, 1.6],
};

export const SHAPE_NAMES = Object.keys(SHAPE_PARAMS) as ShapeName[];
const STEPS = 180;

export function radii(kind: ShapeName) {
  const [n, a, sharp] = SHAPE_PARAMS[kind] ?? SHAPE_PARAMS.cookie;
  const out: number[] = [];
  for (let i = 0; i < STEPS; i++) {
    const t = (2 * Math.PI * i) / STEPS;
    const c = Math.cos(n * t);
    const wave = Math.sign(c) * Math.abs(c) ** (1 / sharp);
    out.push(1 - a + a * wave);
  }
  return out;
}

export function radiiPath(rs: number[], cx: number, cy: number, r: number) {
  const pts = rs.map((k, i) => {
    const t = (2 * Math.PI * i) / rs.length - Math.PI / 2;
    return `${(cx + r * k * Math.cos(t)).toFixed(1)} ${(cy + r * k * Math.sin(t)).toFixed(1)}`;
  });
  return "M" + pts.join(" L") + " Z";
}

export function shape(kind: ShapeName, cx: number, cy: number, r: number) {
  return radiiPath(radii(kind), cx, cy, r);
}

// Icons
export function icon(icons: Icons, name: string, x: number, y: number, size: number, fill: string) {
  if (name.startsWith("brand:")) {
    const b = icons.brand[name.slice(6)];
    if (!b) return "";
    return `<path d="${b.d}" fill="${fill}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${(size / 24).toFixed(4)})"/>`;
  }
  const d = icons.symbol[name];
  if (!d) return "";
  const s = size / 960;
  return `<path d="${d}" fill="${fill}" transform="translate(${x.toFixed(1)} ${(y + 960 * s).toFixed(1)}) scale(${s.toFixed(4)})"/>`;
}

// Svg
export function txt(
  x: number, y: number, s: string, size: number, fill: string,
  o: { weight?: number; cls?: string; delay?: number; anchor?: string; extra?: string; face?: Face } = {},
) {
  let style = `font-size:${size}px;font-weight:${o.weight ?? 400};`;
  if (o.delay !== undefined) style += `animation-delay:${o.delay.toFixed(2)}s;`;
  const c = o.cls ? ` class="${o.cls}"` : "";
  const font = o.face && o.face !== "default" ? ` data-font="${o.face}"` : "";
  return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" fill="${fill}" text-anchor="${o.anchor ?? "start"}" style="${style}"${c}${font}${o.extra ?? ""}>${esc(s)}</text>`;
}

export function pop(body: string, delay: number, cls = "pop") {
  return `<g class="${cls}" style="animation-delay:${delay.toFixed(2)}s">${body}</g>`;
}

const CSS = `
.up{animation:up .8s cubic-bezier(.05,.7,.1,1) both}
.pop{transform-box:fill-box;transform-origin:center;animation:pop .6s cubic-bezier(.34,1.56,.64,1) both}
.fade{animation:fade .9s ease both}
.spin{transform-box:fill-box;transform-origin:center;animation:spin 40s linear infinite}
.spin-r{transform-box:fill-box;transform-origin:center;animation:spin 28s linear infinite reverse}
.bob{transform-box:fill-box;transform-origin:center;animation:bob 7s ease-in-out infinite}
.grow{transform-box:fill-box;transform-origin:left center;animation:grow 1.1s cubic-bezier(.2,0,0,1) both}
.wght{animation:wght 1.6s cubic-bezier(.2,0,0,1) .2s both}
.wave{animation:wave 2.4s linear infinite}
.blink{animation:blink 1s step-end infinite}
@keyframes blink{50%{opacity:0}}
@keyframes up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes pop{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:scale(1)}}
@keyframes fade{from{opacity:0}to{opacity:1}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes bob{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-10px) rotate(12deg)}}
@keyframes grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes wght{from{font-variation-settings:'ROND' 100,'wght' 400}to{font-variation-settings:'ROND' 100,'wght' 760}}
@keyframes wave{from{transform:translateX(0)}to{transform:translateX(-48px)}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}`;

export function svg(w: number, h: number, body: string, title: string, motion = true, extra = "", skin?: Skin) {
  let fonts = body.includes("<text")
    ? `@font-face{font-family:G;src:url(data:font/woff2;base64,${FONT}) format('woff2');font-weight:400 800}`
    : "";
  if (skin === "chrome") {
    fonts = "";
    if (body.includes("<text")) {
      for (const [face, sources] of Object.entries(CHROME_FONTS)) {
        if (face !== "body" && !body.includes(`data-font="${face}"`)) continue;
        for (const source of sources) {
          fonts += `@font-face{font-family:C${face};src:url(data:font/woff2;base64,${source.data}) format('woff2');font-weight:${source.weight}}`;
        }
      }
    }
  }
  const css =
    fonts +
    `text{font-family:G,'Google Sans','Segoe UI',sans-serif;font-variation-settings:'ROND' 100}` +
    CSS +
    extra +
    (skin === "chrome" ? `text{font-family:Cbody,sans-serif;font-variation-settings:normal;font-kerning:none;font-variant-ligatures:none}text[data-font="display"]{font-family:Cdisplay,Cbody,sans-serif}text[data-font="mono"]{font-family:Cmono,Cbody,monospace}.spin,.spin-r,.bob,.wave{animation:none}.pop,.up,.wght{animation:fade .5s ease both}` : "") +
    (motion ? "" : "*{animation:none!important}");
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
    `width="${+w.toFixed(2)}" height="${+h.toFixed(2)}" viewBox="0 0 ${+w.toFixed(2)} ${+h.toFixed(2)}" role="img" aria-label="${esc(title)}">` +
    `<title>${esc(title)}</title>${skin === "chrome" && body.includes("<text") ? `<metadata>${esc(CHROME_LICENSES)}</metadata>` : ""}<style>${css}</style>${body}</svg>`
  );
}

export function chip(
  icons: Icons, p: Palette, x: number, y: number, label: string,
  o: { icon?: string; delay?: number; h?: number; size?: number; style?: "tonal" | "outlined" } = {},
  skin?: Skin,
): [string, number] {
  const { textWidth, txt } = typography(skin);
  const h = o.h ?? 36;
  const size = o.size ?? 15;
  const pad = 14;
  const iw = o.icon ? 18 : 0;
  const gap = o.icon ? 8 : 0;
  const w = pad * 2 + iw + gap + textWidth(label, size, 500);
  let bg: string;
  let fg: string;
  if (o.style === "tonal") {
    bg = `<rect x="${x}" y="${y}" width="${w.toFixed(1)}" height="${h}" rx="10" fill="${p.secondaryContainer}"/>`;
    fg = p.onSecondaryContainer;
  } else {
    bg = `<rect x="${x + 0.5}" y="${y + 0.5}" width="${(w - 1).toFixed(1)}" height="${h - 1}" rx="10" fill="${p.surfaceContainerLow}" stroke="${p.outlineVariant}"/>`;
    fg = p.onSurfaceVariant;
  }
  if (skin === "chrome") bg = plate(x, y, w, h, p.surfaceContainerLow, p.outlineVariant, 6);
  let body = bg;
  if (o.icon) body += icon(icons, o.icon, x + pad, y + (h - 18) / 2, 18, p.primary);
  body += txt(x + pad + iw + gap, y + h / 2 + size * 0.36, label, size, fg, { weight: 500 });
  return [pop(body, o.delay ?? 0), w];
}
