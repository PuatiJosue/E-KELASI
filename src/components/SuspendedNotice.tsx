import { Logo } from "@/components/Logo";
import { LogoutButton } from "@/components/LogoutButton";
import { T } from "@/lib/i18n";

// Écran affiché quand l'abonnement de l'école n'est pas à jour.
export function SuspendedNotice() {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--bg)", padding: 24 }}>
      <div className="ek-card" style={{ width: "100%", maxWidth: 460, padding: 32, textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
          <Logo size={32} withWord />
        </div>
        <h1 style={{ fontSize: 20, fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>
          <T fr="Compte suspendu" en="Account suspended" />
        </h1>
        <p style={{ fontSize: 13.5, color: "var(--ink-3)", lineHeight: 1.6, marginBottom: 22 }}>
          <T
            fr="L'abonnement de votre établissement à E-KELASI n'est pas à jour. L'accès est temporairement suspendu. Contactez E-KELASI pour régulariser et réactiver votre compte."
            en="Your school's E-KELASI subscription is past due. Access is temporarily suspended. Contact E-KELASI to settle and reactivate your account."
          />
        </p>
        <LogoutButton />
      </div>
    </div>
  );
}
