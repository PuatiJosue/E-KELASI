import { redirect } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { createClient } from "@/lib/supabase/server";
import { updatePasswordAction } from "./actions";

// L'utilisateur arrive ici depuis le lien de réinit envoyé par email.
// La route /auth/confirm a déjà échangé le token et posé le cookie de session.
// Si on n'a pas de session, on renvoie vers le login.
export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login?error=" + encodeURIComponent("Lien expiré, redemande un nouveau lien."));
  }

  const error = searchParams?.error;

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--bg)", padding: 24 }}>
      <div className="ek-card" style={{ width: "100%", maxWidth: 420, padding: 32 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <Logo size={36} withWord />
        </div>
        <h1 style={{ textAlign: "center", fontSize: 22, fontFamily: "var(--font-display)", color: "var(--ink)", marginBottom: 4 }}>
          Nouveau mot de passe
        </h1>
        <p style={{ textAlign: "center", fontSize: 13, color: "var(--ink-3)", marginBottom: 24 }}>
          Choisis un mot de passe d&apos;au moins 8 caractères.
        </p>

        <form action={updatePasswordAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)" }}>Nouveau mot de passe</span>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              placeholder="••••••••"
              style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--surface)", fontSize: 14, color: "var(--ink)" }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)" }}>Confirmation</span>
            <input
              name="confirm"
              type="password"
              required
              minLength={8}
              placeholder="••••••••"
              style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--surface)", fontSize: 14, color: "var(--ink)" }}
            />
          </label>
          <button type="submit" className="ek-btn ek-btn-primary" style={{ marginTop: 6 }}>
            Mettre à jour
          </button>
        </form>

        {error && (
          <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: "rgba(192,58,43,0.10)", color: "var(--danger)", fontSize: 12.5, fontWeight: 600, textAlign: "center" }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: 18, textAlign: "center", fontSize: 12, color: "var(--ink-3)" }}>
          <Link href="/login" style={{ color: "var(--brand-600)", fontWeight: 600 }}>
            ← Annuler
          </Link>
        </div>
      </div>
    </div>
  );
}
