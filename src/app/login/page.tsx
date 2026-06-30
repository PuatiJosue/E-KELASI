import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Icon } from "@/components/Icon";
import { loginAction } from "./actions";
import { PasswordInput } from "./PasswordInput";

// Objets décoratifs flottants (façon illustration 3D).
const FLOATERS: { e: string; pos: React.CSSProperties; size: number; rot: number; dur: number; delay: number }[] = [
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

const fieldWrap: React.CSSProperties = { position: "relative" };
const fieldInput: React.CSSProperties = {
  width: "100%",
  padding: "13px 14px 13px 42px",
  borderRadius: 12,
  border: "1px solid var(--border-strong)",
  background: "var(--surface)",
  fontSize: 14,
  color: "var(--ink)",
  outline: "none",
};
const fieldIcon: React.CSSProperties = { position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--ink-3)", display: "flex" };
const fieldLabel: React.CSSProperties = { fontSize: 12.5, fontWeight: 600, color: "var(--ink-2)" };

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  const error = searchParams?.error;
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
      {/* Objets flottants décoratifs */}
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
          maxWidth: 410,
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
          Espace E-KLASS
        </h1>
        <p style={{ textAlign: "center", fontSize: 13.5, color: "var(--ink-3)", marginBottom: 24, lineHeight: 1.45 }}>
          Connectez-vous à votre compte E-KLASS.
        </p>

        {error && (
          <div
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              background: "rgba(225,29,72,0.10)",
              color: "var(--danger)",
              fontSize: 12.5,
              fontWeight: 600,
              marginBottom: 16,
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        <form action={loginAction} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <span style={fieldLabel}>Email</span>
            <div style={fieldWrap}>
              <span style={fieldIcon}><Icon name="user" size={17} /></span>
              <input name="email" type="email" required placeholder="vous@e-kelasi.com" style={fieldInput} />
            </div>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <span style={fieldLabel}>Mot de passe</span>
            <PasswordInput />
          </label>

          <button type="submit" className="ek-btn ek-btn-primary" style={{ marginTop: 4, height: 46, fontSize: 14.5 }}>
            <Icon name="login" size={17} stroke={2.2} />
            Se connecter
          </button>
        </form>

        <div style={{ marginTop: 16, textAlign: "center", fontSize: 12.5 }}>
          <Link href="/forgot-password" style={{ color: "var(--brand-600)", fontWeight: 600 }}>
            Mot de passe oublié ?
          </Link>
        </div>

        <div style={{ marginTop: 14, textAlign: "center", fontSize: 12.5, color: "var(--ink-3)" }}>
          Prof avec un code d&apos;accès ?{" "}
          <Link href="/teacher-signup" style={{ color: "var(--brand-600)", fontWeight: 700 }}>
            S&apos;inscrire ici
          </Link>
        </div>
      </div>
    </div>
  );
}
