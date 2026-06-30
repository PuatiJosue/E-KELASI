import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { AdminSignupForm } from "./AdminSignupForm";

export default function AdminSignupPage() {
  return (
    <AuthShell
      maxWidth={460}
      title="Équipe E-KELASI — première connexion"
      subtitle="Saisissez le code d'accès qui vous a été remis, puis créez vos identifiants d'administrateur."
      footer={
        <>
          Vous avez déjà un compte ?{" "}
          <Link href="/login" style={{ color: "var(--brand-600)", fontWeight: 600 }}>
            Se connecter
          </Link>
        </>
      }
    >
      <AdminSignupForm />
    </AuthShell>
  );
}
