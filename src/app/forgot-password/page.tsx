import Link from "next/link";
import { Logo } from "@/components/Logo";
import { requestPasswordResetAction } from "./actions";

export default function ForgotPasswordPage({
  searchParams,
}: {
  searchParams?: { sent?: string; error?: string };
}) {
  const sent = searchParams?.sent === "1";
  const error = searchParams?.error;

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--bg)", padding: 24 }}>
      <div className="ek-card" style={{ width: "100%", maxWidth: 420, padding: 32 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <Logo size={36} withWord />
        </div>
        <h1 style={{ textAlign: "center", fontSize: 22, fontFamily: "var(--font-display)", color: "var(--ink)", marginBottom: 4 }}>
          Mot de passe oublié
        </h1>
        <p style={{ textAlign: "center", fontSize: 13, color: "var(--ink-3)", marginBottom: 24 }}>
          On t&apos;envoie un lien pour le réinitialiser.
        </p>

        {sent ? (
          <div style={{ padding: 14, borderRadius: 10, background: "var(--accent-50)", color: "var(--accent)", fontSize: 13, fontWeight: 600, textAlign: "center" }}>
            ✓ Si cet email existe, un lien vient d&apos;être envoyé. Vérifie ta boîte de réception.
          </div>
        ) : (
          <form action={requestPasswordResetAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)" }}>Email</span>
              <input
                name="email"
                type="email"
                required
                placeholder="vous@e-kelasi.com"
                style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--surface)", fontSize: 14, color: "var(--ink)" }}
              />
            </label>
            <button type="submit" className="ek-btn ek-btn-primary" style={{ marginTop: 6 }}>
              Envoyer le lien
            </button>
          </form>
        )}

        {error && (
          <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: "rgba(192,58,43,0.10)", color: "var(--danger)", fontSize: 12.5, fontWeight: 600, textAlign: "center" }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: 18, textAlign: "center", fontSize: 12, color: "var(--ink-3)" }}>
          <Link href="/login" style={{ color: "var(--brand-600)", fontWeight: 600 }}>
            ← Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
