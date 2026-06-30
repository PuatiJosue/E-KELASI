import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AuthShell, AuthError } from "@/components/auth/AuthShell";
import { PasswordInput } from "@/components/auth/PasswordInput";
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
    <AuthShell
      title="Nouveau mot de passe"
      subtitle="Choisis un mot de passe d'au moins 8 caractères."
      footer={
        <Link href="/login" style={{ color: "var(--brand-600)", fontWeight: 600 }}>
          ← Annuler
        </Link>
      }
    >
      <form action={updatePasswordAction} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-2)" }}>Nouveau mot de passe</span>
          <PasswordInput name="password" minLength={8} autoComplete="new-password" />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-2)" }}>Confirmation</span>
          <PasswordInput name="confirm" minLength={8} autoComplete="new-password" />
        </label>
        <button type="submit" className="ek-btn ek-btn-primary" style={{ marginTop: 4, height: 46, fontSize: 14.5 }}>
          Mettre à jour
        </button>
      </form>

      {error && <AuthError>{error}</AuthError>}
    </AuthShell>
  );
}
