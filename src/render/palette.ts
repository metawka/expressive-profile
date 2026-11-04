import {
  argbFromHex,
  hexFromArgb,
  Hct,
  SchemeExpressive,
  SchemeFidelity,
  SchemeMonochrome,
  SchemeTonalSpot,
  SchemeVibrant,
} from "@material/material-color-utilities";
import type { Palette, SchemeName, Skin } from "./types";

const SCHEMES = {
  tonalSpot: SchemeTonalSpot,
  vibrant: SchemeVibrant,
  expressive: SchemeExpressive,
  fidelity: SchemeFidelity,
  monochrome: SchemeMonochrome,
};

const ROLES = [
  "primary", "onPrimary", "primaryContainer", "onPrimaryContainer",
  "secondary", "onSecondary", "secondaryContainer", "onSecondaryContainer",
  "tertiary", "onTertiary", "tertiaryContainer", "onTertiaryContainer",
  "error", "onError", "errorContainer", "onErrorContainer",
  "surface", "surfaceDim", "surfaceBright", "surfaceContainerLowest", "surfaceContainerLow",
  "surfaceContainer", "surfaceContainerHigh", "surfaceContainerHighest",
  "onSurface", "onSurfaceVariant", "outline", "outlineVariant", "inverseSurface", "inverseOnSurface",
  "inversePrimary", "scrim", "shadow",
] as const;

export function palette(seed: string, scheme: SchemeName, dark: boolean, skin?: Skin): Palette {
  if (skin === "chrome") return chromePalette(dark);
  const Scheme = SCHEMES[scheme] ?? SchemeTonalSpot;
  const s = new Scheme(Hct.fromInt(argbFromHex(seed)), dark, 0) as unknown as Record<string, number>;
  const out: Palette = {};
  for (const r of ROLES) out[r] = hexFromArgb(s[r]);
  return out;
}

function chromePalette(dark: boolean): Palette {
  const surfaces = dark
    ? ["#090b0d", "#090b0d", "#25292d", "#07090b", "#101316", "#14181b", "#1b2024", "#262c31"]
    : ["#e8ebed", "#d9dfe2", "#ffffff", "#ffffff", "#f7f8f9", "#f0f3f4", "#e0e5e8", "#cfd7dc"];
  const out: Palette = Object.fromEntries(
    ["surface", "surfaceDim", "surfaceBright", "surfaceContainerLowest", "surfaceContainerLow", "surfaceContainer", "surfaceContainerHigh", "surfaceContainerHighest"]
      .map((role, n) => [role, surfaces[n]]),
  );
  return {
    ...out,
    primary: dark ? "#dce4e8" : "#28363e",
    onPrimary: dark ? "#101619" : "#ffffff",
    primaryContainer: dark ? "#27343b" : "#d3dfe4",
    onPrimaryContainer: dark ? "#e4f1f5" : "#162c36",
    secondary: dark ? "#acb9c1" : "#475962",
    onSecondary: dark ? "#11191e" : "#ffffff",
    secondaryContainer: dark ? "#232b30" : "#dbe2e6",
    onSecondaryContainer: dark ? "#d9e3e8" : "#27363e",
    tertiary: dark ? "#a5e3eb" : "#245e68",
    onTertiary: dark ? "#122a30" : "#ffffff",
    tertiaryContainer: dark ? "#19363e" : "#d3edf0",
    onTertiaryContainer: dark ? "#c6f2f6" : "#163c44",
    onSurface: dark ? "#f0f3f5" : "#14191c",
    onSurfaceVariant: dark ? "#b1bdc5" : "#45535c",
    outline: dark ? "#7a8993" : "#637580",
    outlineVariant: dark ? "#3d4951" : "#a8b5bd",
    inverseSurface: dark ? "#e8ebed" : "#171d21",
    inverseOnSurface: dark ? "#14191c" : "#f0f3f5",
    inversePrimary: dark ? "#28363e" : "#dce4e8",
    error: dark ? "#ffb4ab" : "#ba1a1a",
    onError: dark ? "#690005" : "#ffffff",
    errorContainer: dark ? "#93000a" : "#ffdad6",
    onErrorContainer: dark ? "#ffdad6" : "#410002",
    scrim: "#000000",
    shadow: "#000000",
  };
}
