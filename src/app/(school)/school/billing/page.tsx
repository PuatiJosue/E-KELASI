import { PageHeader } from "@/components/KPI";
import { T } from "@/lib/i18n";
import { getMySchool } from "@/lib/school-db";
import { schoolPriceLabel } from "@/lib/school-price";
import { PayButton } from "./PayButton";

export default async function SchoolBilling({
  searchParams,
}: {
  searchParams: { success?: string; canceled?: string };
}) {
  const school = await getMySchool();
  const active = school?.status === "active";
  const price = schoolPriceLabel();

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, maxWidth: 640 }}>
      <PageHeader
        title={{ fr: "Abonnement", en: "Subscription" }}
        sub={{ fr: `Votre abonnement E-KLASS (${price}/mois).`, en: `Your E-KLASS subscription (${price}/mo).` }}
      />

      {searchParams?.success && (
        <div style={{ padding: "10px 12px", borderRadius: 9, background: "var(--accent-100)", color: "var(--accent)", fontSize: 12.5, fontWeight: 600 }}>
          <T fr="Paiement reçu. Merci ! Votre accès est actif." en="Payment received. Thank you! Your access is active." />
        </div>
      )}
      {searchParams?.canceled && (
        <div style={{ padding: "10px 12px", borderRadius: 9, background: "var(--surface-2)", color: "var(--ink-2)", fontSize: 12.5, fontWeight: 600 }}>
          <T fr="Paiement annulé." en="Payment canceled." />
        </div>
      )}

      <div className="ek-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontSize: 11.5, color: "var(--ink-3)", fontWeight: 600 }}>
              <T fr="STATUT" en="STATUS" />
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-display)", marginTop: 4 }}>
              {active ? <T fr="Actif" en="Active" /> : <T fr="Inactif / en attente" en="Inactive / pending" />}
            </div>
          </div>
          <span className={`ek-chip ${active ? "success" : "warn"}`}>
            {active ? <T fr="À jour" en="Up to date" /> : <T fr="À régler" en="Due" />}
          </span>
        </div>

        <div style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.6 }}>
          <T
            fr="L'abonnement donne accès à toute la plateforme pour votre établissement (direction, professeurs) et permet à vos parents d'utiliser l'app."
            en="The subscription unlocks the whole platform for your school (staff, teachers) and lets your parents use the app."
          />
        </div>

        <div style={{ borderTop: "1px solid var(--divider)", paddingTop: 16, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--ink)" }}>
            {price.replace(" ", " ")}<span style={{ fontSize: 13, color: "var(--ink-3)", fontWeight: 500 }}> / <T fr="mois" en="month" /></span>
          </div>
          <div style={{ flex: 1 }} />
          <PayButton price={price} />
        </div>
      </div>

      <div style={{ fontSize: 12, color: "var(--ink-3)", lineHeight: 1.5 }}>
        <T
          fr="Pas de carte bancaire ? Vous pouvez aussi régler par Mobile Money ou virement — contactez E-KLASS, votre accès sera activé manuellement."
          en="No card? You can also pay by Mobile Money or transfer — contact E-KLASS and your access will be enabled manually."
        />
      </div>
    </div>
  );
}
