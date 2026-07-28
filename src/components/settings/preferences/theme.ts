"use client";

// Préférences d'apparence : types, clés de stockage et application au DOM.

export type Appearance = "auto" | "light" | "dark";
export type Font = "bricolage" | "editorial" | "geometric" | "jakarta";
export type CardStyle = "default" | "flat" | "elevated" | "outlined";

export const APPEARANCE_KEY = "ek-appearance";
export const COLOR_KEY = "ek-color";
export const FONT_KEY = "ek-font";
export const CARDSTYLE_KEY = "ek-cardstyle";

export const DEFAULT_COLOR = "#1E2F6D";
export const COLORS = ["#1E2F6D", "#E0701E", "#1D6650", "#3A6DBC", "#9747BB", "#B8475B"];
export const FONTS: { value: Font; label: string }[] = [
  { value: "bricolage", label: "Bricolage" },
  { value: "editorial", label: "Editorial" },
  { value: "geometric", label: "Geometric" },
  { value: "jakarta", label: "Jakarta" },
];
export const CARD_STYLES: { value: CardStyle; labelFr: string; labelEn: string }[] = [
  { value: "default", labelFr: "Défaut", labelEn: "Default" },
  { value: "flat", labelFr: "Plat", labelEn: "Flat" },
  { value: "elevated", labelFr: "Ombré", labelEn: "Elevated" },
  { value: "outlined", labelFr: "Bordé", labelEn: "Outlined" },
];

export function applyAppearance(pref: Appearance) {
  if (typeof document === "undefined") return;
  const dark =
    pref === "dark" ||
    (pref === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
}

export function hexToRgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}
export function mixHex(a: string, b: string, t: number) {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  const p = (v: number) => Math.round(v).toString(16).padStart(2, "0");
  return "#" + p(x[0] * (1 - t) + y[0] * t) + p(x[1] * (1 - t) + y[1] * t) + p(x[2] * (1 - t) + y[2] * t);
}
export function applyColor(hex: string) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const [r, g, b] = hexToRgb(hex);
  root.style.setProperty("--brand", hex);
  root.style.setProperty("--brand-soft", `rgba(${r},${g},${b},0.10)`);
  root.style.setProperty("--brand-600", mixHex(hex, "#000000", 0.25));
  root.style.setProperty("--brand-700", mixHex(hex, "#000000", 0.45));
  root.style.setProperty("--brand-100", mixHex(hex, "#ffffff", 0.75));
  root.style.setProperty("--brand-50", mixHex(hex, "#ffffff", 0.92));
}
export function applyFont(font: Font) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-font", font);
}
export function applyCardStyle(style: CardStyle) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-card-style", style);
}

// Carte « Préférences » réutilisable sur toutes les consoles (prof, école, admin) :
// langue (cookie, global), apparence (thème clair/sombre/auto) et notifications.

