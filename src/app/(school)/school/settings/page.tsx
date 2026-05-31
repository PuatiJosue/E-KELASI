import { PageHeader } from "@/components/KPI";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import { getMySchool } from "@/lib/school-db";

export default async function SchoolSettings() {
  const school = await getMySchool();

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, maxWidth: 760 }}>
      <PageHeader title={{ fr: "Paramètres", en: "Settings" }} />

      <div className="ek-card" style={{ padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-display)" }}>
          <T fr="École" en="School" />
        </div>
        <Row label="Nom" value={school?.name ?? "—"} />
        <Row label="Ville" value={`${school?.city ?? "—"}, ${school?.countryCode ?? ""}`} />
        <Row label="Plan" value={school?.plan === "pro" ? "Pro · $120/mois" : "Standard · $80/mois"} />
        <Row label="Statut" value={school?.status ?? "—"} last />
      </div>

      <div className="ek-card" style={{ padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-display)" }}>
          <T fr="Année scolaire" en="School year" />
        </div>
        <Row label="Année en cours" value="2025-2026" action={<button className="ek-btn ek-btn-outline" style={{ height: 28, fontSize: 11 }}>Modifier</button>} />
        <Row label="Trimestre actif" value="T2 (janvier - avril)" last action={<button className="ek-btn ek-btn-outline" style={{ height: 28, fontSize: 11 }}>Changer</button>} />
      </div>

      <div className="ek-card" style={{ padding: 20, borderLeft: "3px solid var(--danger)" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--danger)", fontFamily: "var(--font-display)" }}>
          <T fr="Zone de danger" en="Danger zone" />
        </div>
        <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4, marginBottom: 12 }}>
          <T fr="Actions irréversibles." en="Irreversible actions." />
        </div>
        <button className="ek-btn" style={{ background: "rgba(192,58,43,0.10)", color: "var(--danger)", height: 32, fontSize: 12 }}>
          <T fr="Désactiver l'école" en="Disable school" />
        </button>
      </div>
    </div>
  );
}

function Row({ label, value, last, action }: { label: string; value: React.ReactNode; last?: boolean; action?: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 0",
        borderBottom: last ? "none" : "1px solid var(--divider)",
        gap: 12,
      }}
    >
      <div>
        <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{label}</div>
        <div style={{ fontSize: 13.5, color: "var(--ink)", fontWeight: 600, marginTop: 2 }}>{value}</div>
      </div>
      {action}
    </div>
  );
}
