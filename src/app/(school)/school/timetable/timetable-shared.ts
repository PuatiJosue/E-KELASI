// Constantes, helpers de couleur et utilitaires de date partagés par
// l'emploi du temps (grille éditable, calendrier hebdo et exports).

import type { TimetableSlot } from "@/lib/content-db";

export const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
export const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

// Palette de couleurs proposée pour les cours (styles de la maquette).
export const PALETTE = ["#7C6CF0", "#E8823C", "#2FA8C0", "#3FA663", "#E0518A", "#4F86E8", "#D9A03A", "#C0553C", "#5B8DEF", "#9C6ADE", "#2E8B7A", "#B23B6E"];

export function escapeHtml(s: string) {
  return (s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

// Couleur stable par matière (repli quand aucune couleur n'est choisie).
export function colorFor(subject: string) {
  let h = 0;
  for (let i = 0; i < subject.length; i++) h = (h * 31 + subject.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

// Noir ou blanc selon la luminance du fond.
export function readableText(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return "#fff";
  const n = parseInt(m[1], 16);
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.62 ? "#1b1f2e" : "#fff";
}

export const toMin = (t: string) => {
  const [h, m] = (t || "0:0").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

// Trie par jour puis heure.
export const byDayTime = (a: TimetableSlot, b: TimetableSlot) => a.day - b.day || a.startTime.localeCompare(b.startTime);

// ── Ligne éditable ──────────────────────────────────────────────────
export type Row = { key: string; day: number; startTime: string; endTime: string; subject: string; teacher: string; room: string; color: string };
export const newKey = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Math.random()));
export const blankRow = (day = 1, startTime = "08:00", endTime = "09:00"): Row => ({ key: newKey(), day, startTime, endTime, subject: "", teacher: "", room: "", color: "" });

export const input: React.CSSProperties = {
  height: 34, padding: "0 8px", borderRadius: 8, border: "1px solid var(--border-strong)",
  background: "var(--surface)", color: "var(--ink)", fontSize: 13, outline: "none", width: "100%",
};

export const rowColor = (r: { color: string; subject: string }) => r.color || colorFor(r.subject.trim() || "•");

// ── Calendrier hebdomadaire (jours en colonnes, axe horaire vertical) ──
export const HOUR_PX = 58;

export function mondayOf(base: Date) {
  const d = new Date(base);
  const wd = (d.getDay() + 6) % 7; // 0 = lundi
  d.setDate(d.getDate() - wd);
  d.setHours(0, 0, 0, 0);
  return d;
}
export const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const fmtDay = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;

