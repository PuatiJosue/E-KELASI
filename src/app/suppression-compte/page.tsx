import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Suppression de compte — E-KLASS",
  description: "Comment demander la suppression de votre compte E-KLASS et de vos données.",
};

export default function AccountDeletionPage() {
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
        Suppression de compte
      </h1>
      <p style={{ color: "var(--ink-3)", marginTop: 4, fontSize: 13 }}>Application E-KLASS</p>

      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-display)", marginBottom: 8 }}>
          Comment demander la suppression
        </h2>
        <div style={{ fontSize: 14.5, color: "var(--ink-2)" }}>
          Pour supprimer votre compte E-KLASS et les données associées, envoyez un e-mail à{" "}
          <a href="mailto:contacte-klass@protonmail.com?subject=Suppression%20de%20compte" style={{ color: "var(--brand)", fontWeight: 600 }}>
            contacte-klass@protonmail.com
          </a>{" "}
          avec l’objet « Suppression de compte », depuis l’adresse e-mail de votre compte. Votre demande
          sera traitée sous 30 jours.
        </div>
      </section>

      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-display)", marginBottom: 8 }}>
          Données supprimées
        </h2>
        <div style={{ fontSize: 14.5, color: "var(--ink-2)" }}>
          La suppression efface définitivement : votre profil (nom, e-mail, téléphone, photo), vos liens
          avec les élèves, et vos messages. Les données scolaires (notes, devoirs) appartiennent à
          l’école et sont gérées par celle-ci.
        </div>
      </section>

      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-display)", marginBottom: 8 }}>
          Conservation
        </h2>
        <div style={{ fontSize: 14.5, color: "var(--ink-2)" }}>
          Sauf obligation légale, aucune donnée personnelle n’est conservée après le traitement de votre
          demande de suppression.
        </div>
      </section>
    </main>
  );
}
