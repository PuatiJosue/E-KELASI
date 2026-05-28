import { PageHeader } from "@/components/KPI";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";

function SettingCard({
  title,
  desc,
  children,
}: {
  title: { fr: string; en: string };
  desc?: { fr: string; en: string };
  children: React.ReactNode;
}) {
  return (
    <div className="ek-card" style={{ padding: 20 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-display)" }}>
        <T fr={title.fr} en={title.en} />
      </div>
      {desc && (
        <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4, marginBottom: 14 }}>
          <T fr={desc.fr} en={desc.en} />
        </div>
      )}
      <div style={{ marginTop: desc ? 0 : 14 }}>{children}</div>
    </div>
  );
}

function Row({ label, value, action }: { label: React.ReactNode; value?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 0",
        borderBottom: "1px solid var(--divider)",
        gap: 12,
      }}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{label}</div>
        {value && <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>{value}</div>}
      </div>
      {action}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, maxWidth: 880 }}>
      <PageHeader
        title={{ fr: "Paramètres", en: "Settings" }}
        sub={{
          fr: "Configuration de l'organisation E-KELASI",
          en: "E-KELASI organization configuration",
        }}
      />

      <SettingCard
        title={{ fr: "Organisation", en: "Organization" }}
        desc={{ fr: "Identité publique et facturation.", en: "Public identity and billing." }}
      >
        <Row label="Nom" value="E-KELASI SAS" action={<button className="ek-btn ek-btn-outline" style={{ height: 30, fontSize: 12 }}>Modifier</button>} />
        <Row label="Domaine" value="app.e-kelasi.com" action={<button className="ek-btn ek-btn-outline" style={{ height: 30, fontSize: 12 }}>Modifier</button>} />
        <Row label="SIRET" value="892 471 305 00018" action={<button className="ek-btn ek-btn-outline" style={{ height: 30, fontSize: 12 }}>Modifier</button>} />
      </SettingCard>

      <SettingCard
        title={{ fr: "Intégrations", en: "Integrations" }}
        desc={{ fr: "Stripe, Resend, S3, et autres services.", en: "Stripe, Resend, S3, and other services." }}
      >
        <Row
          label={<><Icon name="creditcard" size={14} style={{ verticalAlign: -2 }} /> Stripe</>}
          value="Connecté · acct_1Q…7Xq"
          action={<span className="ek-chip success">Actif</span>}
        />
        <Row
          label={<><Icon name="mail" size={14} style={{ verticalAlign: -2 }} /> Resend</>}
          value="API key configurée"
          action={<span className="ek-chip success">Actif</span>}
        />
        <Row
          label={<><Icon name="upload" size={14} style={{ verticalAlign: -2 }} /> AWS S3</>}
          value="bucket ekelasi-uploads-prod"
          action={<span className="ek-chip success">Actif</span>}
        />
        <Row
          label={<><Icon name="sparkle" size={14} style={{ verticalAlign: -2 }} /> OpenAI</>}
          value="Pour la prédiction de churn"
          action={<span className="ek-chip warn">Bêta</span>}
        />
      </SettingCard>

      <SettingCard
        title={{ fr: "Sécurité", en: "Security" }}
        desc={{ fr: "Authentification, sessions, audit.", en: "Authentication, sessions, audit." }}
      >
        <Row label="2FA obligatoire" value="Activé pour tous les admins" action={<span className="ek-chip success">On</span>} />
        <Row label="Durée de session" value="12 heures" action={<button className="ek-btn ek-btn-outline" style={{ height: 30, fontSize: 12 }}>Modifier</button>} />
        <Row label="Logs d'audit" value="Conservation 90 jours" action={<button className="ek-btn ek-btn-outline" style={{ height: 30, fontSize: 12 }}>Modifier</button>} />
      </SettingCard>

      <SettingCard
        title={{ fr: "Danger", en: "Danger zone" }}
      >
        <Row
          label="Exporter toutes les données"
          value="JSON + CSV (RGPD article 20)"
          action={<button className="ek-btn ek-btn-outline" style={{ height: 30, fontSize: 12 }}>Exporter</button>}
        />
        <Row
          label={<span style={{ color: "var(--danger)" }}>Supprimer l&apos;organisation</span>}
          value="Action irréversible — supprime toutes les données."
          action={
            <button
              className="ek-btn"
              style={{
                height: 30,
                fontSize: 12,
                background: "rgba(192,58,43,0.1)",
                color: "var(--danger)",
              }}
            >
              Supprimer
            </button>
          }
        />
      </SettingCard>
    </div>
  );
}
