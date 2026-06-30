import Link from "next/link";
import { AuthShell, AuthField, AuthError } from "@/components/auth/AuthShell";
import { requestPasswordResetAction } from "./actions";

export default function ForgotPasswordPage({
  searchParams,
}: {
  searchParams?: { sent?: string; error?: string };
}) {
  const sent = searchParams?.sent === "1";
  const error = searchParams?.error;

  return (
    <AuthShell
      title="Mot de passe oublié"
      subtitle="On t'envoie un lien pour le réinitialiser."
      footer={
        <Link href="/login" style={{ color: "var(--brand-600)", fontWeight: 600 }}>
          ← Retour à la connexion
        </Link>
      }
    >
      {sent ? (
        <div style={{ padding: 14, borderRadius: 12, background: "var(--accent-50)", color: "var(--accent)", fontSize: 13, fontWeight: 600, textAlign: "center" }}>
          ✓ Si cet email existe, un lien vient d&apos;être envoyé. Vérifie ta boîte de réception.
        </div>
      ) : (
        <form action={requestPasswordResetAction} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <AuthField label="Email" icon="user" name="email" type="email" required placeholder="vous@e-kelasi.com" autoComplete="email" />
          <button type="submit" className="ek-btn ek-btn-primary" style={{ marginTop: 6, height: 54, fontSize: 16 }}>
            Envoyer le lien
          </button>
        </form>
      )}

      {error && <AuthError>{error}</AuthError>}
    </AuthShell>
  );
}
