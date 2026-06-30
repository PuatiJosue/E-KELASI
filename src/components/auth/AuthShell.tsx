import type { CSSProperties, InputHTMLAttributes, ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { Icon } from "@/components/Icon";

// Objets décoratifs flottants (illustration « Bureau 3D ») — partagés par
// toutes les pages d'authentification pour un rendu cohérent.
const FLOATERS: { e: string; top: string; left: string; size: number; rot: number; delay: number }[] = [
  { e: "🎓", top: "13%", left: "9%", size: 104, rot: -13, delay: 0 },
  { e: "📘", top: "10%", left: "84%", size: 92, rot: 10, delay: 0.9 },
  { e: "🎒", top: "46%", left: "5%", size: 90, rot: -9, delay: 1.6 },
  { e: "📐", top: "44%", left: "88%", size: 88, rot: 15, delay: 0.5 },
  { e: "📚", top: "74%", left: "12%", size: 96, rot: -7, delay: 1.2 },
  { e: "✏️", top: "72%", left: "82%", size: 88, rot: 8, delay: 2 },
  { e: "🍎", top: "12%", left: "32%", size: 64, rot: 6, delay: 1.4 },
  { e: "🎨", top: "80%", left: "62%", size: 66, rot: -10, delay: 0.7 },
  { e: "✈️", top: "60%", left: "33%", size: 54, rot: -16, delay: 0.3 },
];

const fontClamp = (px: number) => `clamp(${Math.round(px * 0.4)}px, ${(px / 12).toFixed(1)}vw, ${px}px)`;

const AUTH_BG =
  "radial-gradient(34% 40% at 10% 8%, rgba(139,108,240,0.50), transparent 70%)," +
  "radial-gradient(30% 36% at 92% 10%, rgba(168,138,250,0.46), transparent 70%)," +
  "radial-gradient(34% 40% at 4% 60%, rgba(150,118,245,0.34), transparent 72%)," +
  "radial-gradient(36% 40% at 97% 64%, rgba(158,128,248,0.36), transparent 72%)," +
  "radial-gradient(50% 44% at 50% 104%, rgba(140,108,240,0.42), transparent 76%)," +
  "linear-gradient(180deg, #ecedfb 0%, #eef0fc 55%, #f1eefc 100%)";

/** Calque décoratif (pointillés, étoiles, petits cercles). Pure décoration. */
function Decor() {
  return (
    <svg
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      aria-hidden
    >
      <g stroke="#b6a4f2" strokeWidth="3" strokeLinecap="round" fill="none" strokeDasharray="0.5 11">
        <path d="M980 150 C1040 116 1100 128 1140 178" />
        <path d="M300 720 C380 676 480 684 540 726" />
        <path d="M1140 560 C1190 540 1232 552 1252 588" />
        <path d="M200 320 C250 296 300 304 330 340" />
      </g>
      <g fill="#8b6ff5">
        <circle cx="150" cy="250" r="5" /><circle cx="1300" cy="300" r="4.5" />
        <circle cx="240" cy="520" r="4" /><circle cx="1230" cy="700" r="5" />
        <circle cx="720" cy="70" r="4" /><circle cx="600" cy="820" r="4" />
      </g>
      <g fill="#ffb13d">
        <circle cx="110" cy="400" r="5.5" /><circle cx="1330" cy="470" r="4.5" />
        <circle cx="500" cy="180" r="4" /><circle cx="980" cy="780" r="4" />
      </g>
      <g fill="#ff79b0">
        <circle cx="190" cy="160" r="4.5" /><circle cx="1250" cy="200" r="4" />
        <circle cx="170" cy="680" r="5" /><circle cx="1180" cy="120" r="3.5" />
      </g>
      <g fill="none" stroke="#c6b6f6" strokeWidth="2.4">
        <circle cx="1300" cy="380" r="8" /><circle cx="120" cy="600" r="7" /><circle cx="1080" cy="700" r="6" />
      </g>
      <g fill="#ffb13d">
        <path d="M720 30 q4 9 11 11 q-7 2 -11 11 q-4 -9 -11 -11 q7 -2 11 -11 Z" />
        <path d="M1130 250 q3 7 8 8 q-5 1 -8 8 q-3 -7 -8 -8 q5 -1 8 -8 Z" />
        <path d="M260 470 q3 7 8 8 q-5 1 -8 8 q-3 -7 -8 -8 q5 -1 8 -8 Z" />
      </g>
      <g fill="#8b6ff5">
        <path d="M330 250 q3 7 8 8 q-5 1 -8 8 q-3 -7 -8 -8 q5 -1 8 -8 Z" />
        <path d="M1160 640 q3 7 8 8 q-5 1 -8 8 q-3 -7 -8 -8 q5 -1 8 -8 Z" />
      </g>
    </svg>
  );
}

export const authFieldIcon: CSSProperties = { position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#b0acc4", display: "flex", pointerEvents: "none" };
export const authFieldLabel: CSSProperties = { fontSize: 14, fontWeight: 700, color: "#2f2a52" };

/** Champ texte avec libellé + icône (Email, code d'accès…). */
export function AuthField({ label, icon, ...input }: { label: string; icon: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      <span style={authFieldLabel}>{label}</span>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <span style={authFieldIcon}><Icon name={icon} size={18} /></span>
        <input {...input} className="ek-auth-input" style={{ paddingLeft: 46, paddingRight: 16 }} />
      </div>
    </label>
  );
}

/** Champ « code d'accès » : monospace, centré, en capitales. */
export function AuthCodeField({ label, ...input }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      <span style={authFieldLabel}>{label}</span>
      <input
        {...input}
        className="ek-auth-input"
        style={{ paddingLeft: 16, paddingRight: 16, fontSize: 16, fontFamily: "var(--font-mono)", letterSpacing: 2, textAlign: "center", textTransform: "uppercase" }}
      />
    </label>
  );
}

/** Libellé au-dessus d'un champ personnalisé (ex. PasswordInput). */
export function AuthLabel({ children }: { children: ReactNode }) {
  return <span style={authFieldLabel}>{children}</span>;
}

/** Bannière d'erreur cohérente. */
export function AuthError({ children }: { children: ReactNode }) {
  return (
    <div style={{ marginTop: 14, padding: "11px 13px", borderRadius: 12, background: "rgba(225,29,72,0.10)", color: "var(--danger)", fontSize: 13, fontWeight: 600, textAlign: "center" }}>
      {children}
    </div>
  );
}

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  maxWidth = 430,
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
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        padding: "60px 24px",
        background: AUTH_BG,
      }}
    >
      <Decor />

      {FLOATERS.map((f, i) => (
        <span
          key={i}
          aria-hidden
          className="ek-floater ek-hide-mobile"
          style={{
            position: "absolute",
            top: f.top,
            left: f.left,
            fontSize: fontClamp(f.size),
            ["--rot" as any]: `${f.rot}deg`,
            transform: `rotate(${f.rot}deg)`,
            animation: `ek-float ${6 + (i % 4) * 0.5}s ease-in-out ${f.delay}s infinite`,
            filter: "drop-shadow(0 24px 22px rgba(86,56,176,0.30))",
            pointerEvents: "none",
            userSelect: "none",
            zIndex: 1,
          }}
        >
          {f.e}
        </span>
      ))}

      {/* Halo + carte */}
      <div style={{ position: "relative", zIndex: 3, display: "flex", alignItems: "center", justifyContent: "center", width: "100%", maxWidth }}>
        <div style={{ position: "absolute", inset: -60, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(255,255,255,0.85), rgba(255,255,255,0))", filter: "blur(20px)", pointerEvents: "none" }} />

        <div
          style={{
            position: "relative",
            width: "100%",
            background: "var(--surface)",
            borderRadius: 34,
            padding: "42px 40px 38px",
            boxShadow: "0 50px 90px -28px rgba(82,52,170,0.45), 0 16px 36px rgba(82,52,170,0.14)",
            border: "1px solid rgba(255,255,255,0.9)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
            <Logo size={44} withWord />
          </div>
          <h1 style={{ textAlign: "center", fontSize: 30, fontFamily: "var(--font-display)", fontWeight: 800, letterSpacing: "-0.5px", color: "var(--ink)", marginBottom: 10 }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ textAlign: "center", fontSize: 15, color: "#8b87a3", marginBottom: 28, lineHeight: 1.5 }}>
              {subtitle}
            </p>
          )}
          {children}
          {footer && (
            <div style={{ marginTop: 20, textAlign: "center", fontSize: 13.5, color: "#8b87a3" }}>
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
