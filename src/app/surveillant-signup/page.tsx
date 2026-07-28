import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { SurveillantSignupForm } from "./SurveillantSignupForm";

export default function SurveillantSignupPage() {
  return (
    <AuthShell
      maxWidth={460}
      title="Surveillant — première connexion"
      subtitle="Saisis le code que ton école t'a remis, puis crée tes identifiants de connexion."
      footer={
        <>
          Tu as déjà un compte ?{" "}
          <Link href="/login" style={{ color: "var(--brand-600)", fontWeight: 600 }}>
            Se connecter
          </Link>
        </>
      }
    >
      <SurveillantSignupForm />
    </AuthShell>
  );
}
