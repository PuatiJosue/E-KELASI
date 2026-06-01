import Link from "next/link";
import { Logo } from "@/components/Logo";
import { loginAction } from "./actions";

export default function LoginPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "var(--bg)",
        padding: 24,
      }}
    >
      <div className="ek-card" style={{ width: "100%", maxWidth: 420, padding: 32 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <Logo size={36} withWord />
        </div>
        <h1
          style={{
            textAlign: "center",
            fontSize: 22,
            fontFamily: "var(--font-display)",
            color: "var(--ink)",
            marginBottom: 4,
          }}
        >
          Espace E-KELASI
        </h1>
        <p
          style={{
            textAlign: "center",
            fontSize: 13,
            color: "var(--ink-3)",
            marginBottom: 24,
          }}
        >
          Connectez-vous à votre compte E-KELASI.
        </p>

        <form action={loginAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)" }}>Email</span>
            <input
              name="email"
              type="email"
              required
              placeholder="vous@e-kelasi.com"
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid var(--border-strong)",
                background: "var(--surface)",
                fontSize: 14,
                color: "var(--ink)",
              }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)" }}>Mot de passe</span>
            <input
              name="password"
              type="password"
              required
              placeholder="••••••••"
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid var(--border-strong)",
                background: "var(--surface)",
                fontSize: 14,
                color: "var(--ink)",
              }}
            />
          </label>
          <button type="submit" className="ek-btn ek-btn-primary" style={{ marginTop: 6 }}>
            Se connecter
          </button>
        </form>

        <div style={{ marginTop: 14, textAlign: "center", fontSize: 12 }}>
          <Link href="/forgot-password" style={{ color: "var(--brand-600)", fontWeight: 600 }}>
            Mot de passe oublié ?
          </Link>
        </div>

        <div style={{ marginTop: 14, textAlign: "center", fontSize: 12, color: "var(--ink-3)" }}>
          Prof avec un code d&apos;accès ?{" "}
          <Link href="/teacher-signup" style={{ color: "var(--brand-600)", fontWeight: 600 }}>
            S&apos;inscrire ici
          </Link>
        </div>

      </div>
    </div>
  );
}
