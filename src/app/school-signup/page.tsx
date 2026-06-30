import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { SchoolSignupForm } from "./SchoolSignupForm";

export default function SchoolSignupPage() {
  return (
    <AuthShell
      maxWidth={460}
      title="École — première connexion"
      subtitle="Saisissez le code d'accès remis par E-KLASS, puis créez les identifiants de connexion de votre école."
      footer={
        <>
          Vous avez déjà un compte ?{" "}
          <Link href="/login" style={{ color: "var(--brand-600)", fontWeight: 600 }}>
            Se connecter
          </Link>
        </>
      }
    >
      <SchoolSignupForm />
    </AuthShell>
  );
}
