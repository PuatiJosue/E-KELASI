import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { TeacherSignupForm } from "./TeacherSignupForm";

export default function TeacherSignupPage() {
  return (
    <AuthShell
      maxWidth={460}
      title="Prof — première connexion"
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
      <TeacherSignupForm />
    </AuthShell>
  );
}
