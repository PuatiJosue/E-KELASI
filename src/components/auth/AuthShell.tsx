import type { CSSProperties, InputHTMLAttributes, ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { Icon } from "@/components/Icon";

// Objets décoratifs flottants (façon illustration 3D) — partagés par toutes
// les pages d'authentification pour un rendu cohérent.
const FLOATERS: { e: string; pos: CSSProperties; size: number; rot: number; dur: number; delay: number }[] = [
  { e: "🎓", pos: { top: "6%", left: "10%" }, size: 46, rot: -14, dur: 6, delay: 0 },
  { e: "📚", pos: { top: "8%", right: "12%" }, size: 44, rot: 12, dur: 7, delay: 0.6 },
  { e: "🎒", pos: { top: "32%", left: "5%" }, size: 42, rot: -8, dur: 6.5, delay: 1.1 },
  { e: "📐", pos: { top: "30%", right: "7%" }, size: 40, rot: 16, dur: 7.5, delay: 0.3 },
  { e: "✏️", pos: { bottom: "20%", right: "9%" }, size: 38, rot: -20, dur: 6.2, delay: 0.9 },
  { e: "✈️", pos: { bottom: "28%", left: "8%" }, size: 36, rot: 10, dur: 8, delay: 0.2 },
  { e: "📘", pos: { bottom: "8%", left: "16%" }, size: 40, rot: -6, dur: 6.8, delay: 1.4 },
  { e: "🖍️", pos: { bottom: "7%", right: "16%" }, size: 40, rot: 14, dur: 7.2, delay: 0.5 },
  { e: "✨", pos: { top: "20%", left: "30%" }, size: 22, rot: 0, dur: 5.5, delay: 0.8 },
  { e: "✨", pos: { top: "60%", right: "26%" }, size: 20, rot: 0, dur: 5, delay: 1.2 },
];

export const authFieldInput: CSSProperties = {
  width: "100%",
  padding: "13px 14px 13px 42px",
  borderRadius: 12,
  border: "1px solid var(--border-strong)",
  background: "var(--surface)",
  fontSize: 14,
  color: "var(--ink)",
  outline: "none",
};
export const authFieldIcon: CSSProperties = { position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--ink-3)", display: "flex" };
export const authFieldLabel: CSSProperties = { fontSize: 12.5, fontWeight: 600, color: "var(--ink-2)" };

/** Champ texte avec libellé + icône (Email, code d'accès…). */
export function AuthField({ label, icon, ...input }: { label: string; icon: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <span style={authFieldLabel}>{label}</span>
      <div style={{ position: "relative" }}>
        <span style={authFieldIcon}><Icon name={icon} size={17} /></span>
        <input {...input} style={authFieldInput} />
      </div>
    </label>
  );
}

/** Bannière d'erreur cohérente. */
export function AuthError({ children }: { children: ReactNode }) {
  return (
    <div style={{ marginTop: 14, padding: "10px 12px", borderRadius: 10, background: "rgba(225,29,72,0.10)", color: "var(--danger)", fontSize: 12.5, fontWeight: 600, textAlign: "center" }}>
      {children}
    </div>
  );
}

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  maxWidth = 420,
}: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: number;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        position: "relative",
        overflow: "hidden",
        background:
          "radial-gradient(900px 500px at 15% 0%, rgba(139,92,246,0.16), transparent 60%)," +
          "radial-gradient(900px 500px at 90% 100%, rgba(79,102,232,0.16), transparent 60%)," +
          "linear-gradient(160deg, #EFE9FE 0%, #F3F1FE 45%, #FBFAFF 100%)",
      }}
    >
      {FLOATERS.map((f, i) => (
        <span
          key={i}
          aria-hidden
          className="ek-floater"
          style={{
            position: "absolute",
            ...f.pos,
            fontSize: f.size,
            ["--rot" as any]: `${f.rot}deg`,
            transform: `rotate(${f.rot}deg)`,
            animation: `ek-float ${f.dur}s ease-in-out ${f.delay}s infinite`,
            filter: "drop-shadow(0 10px 14px rgba(80,70,160,0.18))",
            pointerEvents: "none",
            userSelect: "none",
            zIndex: 0,
          }}
        >
          {f.e}
        </span>
      ))}

      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth,
          padding: "34px 30px",
          background: "var(--surface)",
          borderRadius: 26,
          border: "1px solid rgba(255,255,255,0.6)",
          boxShadow: "0 24px 70px rgba(86,74,170,0.20), 0 4px 14px rgba(86,74,170,0.08)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
          <Logo size={40} withWord />
        </div>
        <h1 style={{ textAlign: "center", fontSize: 23, fontFamily: "var(--font-display)", color: "var(--ink)", marginBottom: 6 }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ textAlign: "center", fontSize: 13.5, color: "var(--ink-3)", marginBottom: 24, lineHeight: 1.45 }}>
            {subtitle}
          </p>
        )}
        {children}
        {footer && (
          <div style={{ marginTop: 18, textAlign: "center", fontSize: 12.5, color: "var(--ink-3)" }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
