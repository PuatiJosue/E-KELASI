"use client";

// Primitives partagées du module Finance v2 (cartes de stats, modales, puces,
// graphiques). Palette alignée sur le design system de l'app (statuts : vert =
// encaissé/payé, rouge = impayé, ambre = partiel, brand = accent).

import { Icon } from "@/components/Icon";
import { money } from "./finance-export";

export type SchoolBranding = {
  name: string;
  city: string | null;
  commune: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  logoUrl: string | null;
  signatureUrl: string | null;
  directorName: string | null;
};

export const COLORS = {
  collected: "#16A34A",
  remaining: "#E11D48",
  partial: "#D97706",
  brand: "#1D6650",
  accent: "#4F66E8",
};

// ── Carte KPI ────────────────────────────────────────────────────────
export function Kpi({ icon, tint, label, value, sub }: { icon: string; tint: string; label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="ek-card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 600 }}>{label}</span>
        <span style={{ width: 30, height: 30, borderRadius: 8, background: `${tint}1a`, color: tint, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name={icon} size={16} stroke={2} />
        </span>
      </div>
      <div style={{ fontSize: 19, fontWeight: 800, color: "var(--ink)", fontFamily: "var(--font-display)" }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{sub}</div>}
    </div>
  );
}

// ── Puce de statut ───────────────────────────────────────────────────
export function Chip({ label, bg, fg }: { label: string; bg: string; fg: string }) {
  return (
    <span style={{ display: "inline-block", padding: "3px 9px", borderRadius: 999, background: bg, color: fg, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

export const STUDENT_STATUS: Record<string, { label: string; bg: string; fg: string }> = {
  paye:    { label: "Payé",             bg: "rgba(22,163,74,0.12)", fg: "#16A34A" },
  partiel: { label: "Partiellement payé", bg: "rgba(217,119,6,0.12)", fg: "#B45309" },
  impaye:  { label: "Impayé",           bg: "rgba(225,29,72,0.12)", fg: "#E11D48" },
};

// ── Donut (répartition par statut) ───────────────────────────────────
export function Donut({ segments, size = 84 }: { segments: { label: string; value: number; color: string }[]; size?: number }) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const R = size / 2 - 10, C = 2 * Math.PI * R, cx = size / 2;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }} role="img" aria-label="Répartition par statut">
      <circle cx={cx} cy={cx} r={R} fill="none" stroke="var(--surface-2)" strokeWidth={12} />
      {segments.map((s, i) => {
        const len = (s.value / total) * C;
        const el = (
          <circle key={i} cx={cx} cy={cx} r={R} fill="none" stroke={s.color} strokeWidth={12}
            strokeDasharray={`${Math.max(0, len - 2)} ${C - Math.max(0, len - 2)}`} strokeDashoffset={-offset} transform={`rotate(-90 ${cx} ${cx})`} strokeLinecap="round" />
        );
        offset += len;
        return el;
      })}
      <text x={cx} y={cx + 5} textAnchor="middle" fontSize={16} fontWeight={800} fill="var(--ink)">{total}</text>
    </svg>
  );
}

// Affiche un montant par devise (sépare USD / CDF).
export function MoneyLines({ entries, empty = "0" }: { entries: [string, number][]; empty?: string }) {
  const nonZero = entries.filter(([, v]) => Math.abs(v) > 0.001);
  const list = nonZero.length ? nonZero : entries.slice(0, 1);
  if (list.length === 0) return <>{empty}</>;
  return <>{list.map(([c, v]) => <div key={c}>{money(v, c)}</div>)}</>;
}

// ── Graphique en barres empilées (encaissé / restant = attendu) ──────
// Une seule échelle monétaire ; vert = encaissé, rouge = restant. Légende + total.
export function StackedBars({ data, currency }: { data: { label: string; collected: number; remaining: number; currency?: string }[]; currency: string }) {
  const max = Math.max(1, ...data.map((d) => d.collected + d.remaining));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 16, fontSize: 11.5 }}>
        <Legend color={COLORS.collected} label="Encaissé" />
        <Legend color={COLORS.remaining} label="Impayé / restant" />
      </div>
      {data.length === 0 ? (
        <div style={{ color: "var(--ink-3)", fontSize: 12.5, padding: "12px 0" }}>Aucune donnée à afficher.</div>
      ) : data.map((d, i) => {
        const cc = d.currency ?? currency;
        const total = d.collected + d.remaining;
        const cw = (d.collected / max) * 100, rw = (d.remaining / max) * 100;
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5 }}>
              <span style={{ color: "var(--ink-2)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%" }}>{d.label}</span>
              <span style={{ color: "var(--ink-3)" }}>{money(d.collected, cc)} / {money(total, cc)}</span>
            </div>
            <div style={{ display: "flex", height: 14, borderRadius: 7, overflow: "hidden", background: "var(--surface-2)", gap: 2 }}>
              {cw > 0 && <div title={`Encaissé : ${money(d.collected, cc)}`} style={{ width: `${cw}%`, background: COLORS.collected, borderRadius: 6 }} />}
              {rw > 0 && <div title={`Restant : ${money(d.remaining, cc)}`} style={{ width: `${rw}%`, background: COLORS.remaining, borderRadius: 6 }} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--ink-2)" }}>
      <span style={{ width: 10, height: 10, borderRadius: 3, background: color }} /> {label}
    </span>
  );
}

// Jauge de recouvrement (barre horizontale + %).
export function RecoveryBar({ pct }: { pct: number }) {
  const p = Math.max(0, Math.min(100, pct));
  const color = p >= 80 ? COLORS.collected : p >= 40 ? COLORS.partial : COLORS.remaining;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 3, background: "var(--surface-2)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${p}%`, background: color }} />
      </div>
      <span style={{ fontSize: 11.5, fontWeight: 700, color }}>{p.toFixed(0)}%</span>
    </div>
  );
}

// ── Modale ───────────────────────────────────────────────────────────
export function Modal({ title, children, onClose, wide }: { title: string; children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,16,10,0.45)", display: "grid", placeItems: "center", zIndex: 200, padding: 24, overflowY: "auto" }}>
      <div onClick={(e) => e.stopPropagation()} className="ek-card" style={{ width: "100%", maxWidth: wide ? 620 : 460, padding: 22, display: "flex", flexDirection: "column", gap: 12, maxHeight: "90vh", overflowY: "auto" }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-display)" }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}

export function Labeled({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5, ...style }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)" }}>{label}</span>
      {children}
    </label>
  );
}

export function ModalActions({ onClose, onSubmit, pending, submitLabel = "Enregistrer" }: { onClose: () => void; onSubmit: () => void; pending: boolean; submitLabel?: string }) {
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
      <button onClick={onClose} className="ek-btn ek-btn-outline" style={{ flex: 1 }}>Annuler</button>
      <button onClick={onSubmit} disabled={pending} className="ek-btn ek-btn-primary" style={{ flex: 1, opacity: pending ? 0.6 : 1 }}>{pending ? "…" : submitLabel}</button>
    </div>
  );
}

export function Toolbar({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>{children}</div>;
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-3)", display: "flex" }}>
        <Icon name="search" size={15} />
      </span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", padding: "9px 12px 9px 34px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)", fontSize: 13, color: "var(--ink)" }} />
    </div>
  );
}

// Styles inline réutilisés.
export const selStyle: React.CSSProperties = { padding: "0 10px", height: 40, borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)", fontSize: 13, color: "var(--ink)" };
export const modalInp: React.CSSProperties = { width: "100%", padding: "9px 11px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)", fontSize: 13, color: "var(--ink)" };
export const iconBtn: React.CSSProperties = { background: "none", border: "none", cursor: "pointer", color: "var(--ink-3)", padding: 5, display: "flex" };
export const errBox: React.CSSProperties = { padding: 9, borderRadius: 8, background: "rgba(192,58,43,0.10)", color: "var(--danger)", fontSize: 12, fontWeight: 600 };
