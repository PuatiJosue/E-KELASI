import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AuthShell, AuthError, AuthLabel } from "@/components/auth/AuthShell";
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
      <form action={updatePasswordAction} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <AuthLabel>Nouveau mot de passe</AuthLabel>
          <PasswordInput name="password" minLength={8} autoComplete="new-password" />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <AuthLabel>Confirmation</AuthLabel>
          <PasswordInput name="confirm" minLength={8} autoComplete="new-password" />
        </label>
        <button type="submit" className="ek-btn ek-btn-primary" style={{ marginTop: 6, height: 54, fontSize: 16 }}>
          Mettre à jour
        </button>
      </form>

      {error && <AuthError>{error}</AuthError>}
    </AuthShell>
  );
}
