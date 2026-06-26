import Link from "next/link";
import { Logo } from "@/components/Logo";
import { AdminSignupForm } from "./AdminSignupForm";

export default function AdminSignupPage() {
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
      <div className="ek-card" style={{ width: "100%", maxWidth: 460, padding: 32 }}>
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
          Équipe E-KELASI — première connexion
        </h1>
        <p
          style={{
            textAlign: "center",
            fontSize: 13,
            color: "var(--ink-3)",
            marginBottom: 24,
            lineHeight: 1.5,
          }}
        >
          Saisissez le code d&apos;accès qui vous a été remis, puis créez vos
          identifiants d&apos;administrateur.
        </p>

        <AdminSignupForm />

        <div style={{ marginTop: 18, textAlign: "center", fontSize: 12, color: "var(--ink-3)" }}>
          Vous avez déjà un compte ?{" "}
          <Link href="/login" style={{ color: "var(--brand-600)", fontWeight: 600 }}>
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}
