import Link from "next/link";
import { Icon } from "@/components/Icon";
import { AuthShell, AuthField, AuthError } from "@/components/auth/AuthShell";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { loginAction } from "./actions";

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  const error = searchParams?.error;
  return (
    <AuthShell
      title="Espace E-KLASS"
      subtitle="Connectez-vous à votre compte E-KLASS."
      footer={
        <>
          Prof avec un code d&apos;accès ?{" "}
          <Link href="/teacher-signup" style={{ color: "var(--brand-600)", fontWeight: 700 }}>
            S&apos;inscrire ici
          </Link>
        </>
      }
    >
      {error && <AuthError>{error}</AuthError>}

      <form action={loginAction} style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: error ? 16 : 0 }}>
        <AuthField label="Email" icon="user" name="email" type="email" required placeholder="vous@e-kelasi.com" autoComplete="email" />
        <label style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-2)" }}>Mot de passe</span>
          <PasswordInput autoComplete="current-password" />
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
    </AuthShell>
  );
}
