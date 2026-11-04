import type { Palette } from "./types";

export function bevel(x: number, y: number, w: number, h: number, cut = 12) {
  const c = Math.min(cut, w / 4, h / 4);
  return `M${x + c} ${y}H${x + w}V${y + h - c}L${x + w - c} ${y + h}H${x}V${y + c}Z`;
}

export function plate(x: number, y: number, w: number, h: number, fill: string, stroke: string, cut = 12) {
  return `<path d="${bevel(x + 0.5, y + 0.5, w - 1, h - 1, cut)}" fill="${fill}" stroke="${stroke}"/>`;
}

export function panel(w: number, h: number, p: Palette) {
  return plate(0, 0, w, h, p.surfaceContainerLow, p.outlineVariant, 18) +
    `<path d="M24 1H88M${w - 88} ${h - 1}H${w - 24}" fill="none" stroke="${p.outline}" stroke-width="2"/>`;
}

// Original lance ornament
export function lance(x: number, y: number, r: number, fill: string) {
  return `<path d="M0 -100C4 -35 7 -12 15 -15L48 -48L22 -8C35 -4 62 -2 100 0C62 2 35 4 22 8L48 48L15 15C7 12 4 35 0 100C-4 35 -7 12 -15 15L-48 48L-22 8C-35 4 -62 2 -100 0C-62 -2 -35 -4 -22 -8L-48 -48L-15 -15C-7 -12 -4 -35 0 -100Z" transform="translate(${x} ${y}) scale(${r / 100})" fill="${fill}"/>`;
}

export function engraving(p: Palette) {
  return `<defs><linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${p.outline}"/><stop offset=".42" stop-color="${p.onSurface}"/><stop offset=".52" stop-color="${p.outlineVariant}"/><stop offset="1" stop-color="${p.primary}"/></linearGradient><pattern id="etched" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 6L6 0" stroke="${p.outline}" stroke-width=".4"/></pattern></defs>` +
    `<path d="${bevel(20, 20, 250, 260, 24)}" fill="url(#etched)" opacity=".15"/>` +
    `<g opacity=".18">${lance(790, 26, 150, "url(#metal)")}</g>` +
    `<path d="M294 34H694L710 18H802M294 276H748L770 254H816" fill="none" stroke="${p.outlineVariant}"/>` +
    `<path d="M294 34H328M770 254H794" stroke="${p.tertiary}" stroke-width="2"/>` +
    `<g opacity=".55">${lance(805, 256, 12, p.tertiary)}</g>`;
}
