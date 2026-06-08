import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité — E-KELASI",
  description: "Comment E-KELASI collecte, utilise et protège vos données.",
};

const UPDATED = "8 juin 2026";

export default function PrivacyPage() {
  return (
    <main
      style={{
        maxWidth: 760,
        margin: "0 auto",
        padding: "48px 24px 80px",
        color: "var(--ink)",
        fontFamily: "var(--font-body, system-ui)",
        lineHeight: 1.65,
      }}
    >
      <h1 style={{ fontSize: 30, fontWeight: 700, fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
        Politique de confidentialité
      </h1>
      <p style={{ color: "var(--ink-3)", marginTop: 4, fontSize: 13 }}>Dernière mise à jour : {UPDATED}</p>

      <Section title="1. Qui sommes-nous">
        E-KELASI est une plateforme de suivi scolaire qui relie les écoles, les professeurs et les
        parents (site web et application mobile). La présente politique explique quelles données nous
        traitons et pourquoi.
      </Section>

      <Section title="2. Données que nous collectons">
        <ul>
          <li><b>Compte</b> : nom, adresse e-mail, rôle (parent, professeur, direction), et mot de passe (stocké de façon chiffrée).</li>
          <li><b>Données scolaires</b> : élèves rattachés, notes, devoirs, bulletins, messages entre professeurs et parents.</li>
          <li><b>Photos</b> (facultatif) : photo de profil et photo de l’élève, si vous en ajoutez une.</li>
          <li><b>Paiements</b> : les abonnements des écoles sont traités par Stripe ; nous ne stockons jamais les numéros de carte.</li>
          <li><b>Notifications</b> : un identifiant d’appareil pour envoyer les notifications push (si activées).</li>
        </ul>
      </Section>

      <Section title="3. Pourquoi nous les utilisons">
        Uniquement pour faire fonctionner le service : afficher les notes et devoirs aux parents,
        permettre la messagerie école ↔ parents, gérer les accès et les abonnements. Nous
        <b> ne vendons pas</b> vos données et ne les utilisons pas à des fins publicitaires.
      </Section>

      <Section title="4. Hébergement et sécurité">
        Les données sont hébergées chez Supabase (serveurs situés dans l’Union européenne) et
        protégées par des règles d’accès strictes : chaque utilisateur ne voit que les données qui le
        concernent. Les connexions sont chiffrées (HTTPS).
      </Section>

      <Section title="5. Partage">
        Nous partageons des données uniquement avec les prestataires nécessaires au service
        (hébergement Supabase, paiements Stripe) et avec l’école de votre enfant dans le cadre du
        suivi scolaire. Aucune autre transmission à des tiers.
      </Section>

      <Section title="6. Conservation">
        Vos données sont conservées tant que votre compte est actif. Vous pouvez demander la
        suppression de votre compte et de vos données à tout moment (voir contact).
      </Section>

      <Section title="7. Vos droits">
        Vous pouvez accéder à vos données, les corriger ou en demander la suppression. Pour toute
        demande, contactez-nous à l’adresse ci-dessous.
      </Section>

      <Section title="8. Enfants">
        Les données scolaires des élèves sont saisies par l’école et les professeurs, et consultées
        par les parents/tuteurs rattachés. Elles servent exclusivement au suivi scolaire.
      </Section>

      <Section title="9. Contact">
        Pour toute question relative à cette politique ou à vos données :{" "}
        <a href="mailto:contact@e-kelasi.com" style={{ color: "var(--brand)", fontWeight: 600 }}>
          contact@e-kelasi.com
        </a>
        .
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 28 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-display)", marginBottom: 8 }}>{title}</h2>
      <div style={{ fontSize: 14.5, color: "var(--ink-2)" }}>{children}</div>
    </section>
  );
}
