import { KPI, PageHeader } from "@/components/KPI";
import { T } from "@/lib/i18n";
import { listAuditLogs } from "@/lib/db";
import { SecurityLogTable } from "@/components/admin/SecurityLogTable";

export default async function SecurityPage() {
  const events = await listAuditLogs(50);
  const critical = events.filter((e) => e.sev === "critical").length;
  const warnings = events.filter((e) => e.sev === "warn").length;

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={{ fr: "Sécurité & journaux", en: "Security & logs" }}
        sub={{
          fr: "Journal d'audit · ressources & événements plateforme",
          en: "Audit log · resources & platform events",
        }}
      />

      <div className="ek-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        <KPI
          label={<T fr="Statut système" en="System status" />}
          value={
            <>
              <span style={{ color: "var(--accent)" }}>●</span> Healthy
            </>
          }
        />
        <KPI
          label={<T fr="Événements récents" en="Recent events" />}
          value={String(events.length)}
          sub={<T fr="journal d'audit" en="audit log" />}
        />
        <KPI
          label={<T fr="Critiques" en="Critical" />}
          value={String(critical)}
          accent={critical > 0 ? "var(--danger)" : "var(--ink)"}
        />
        <KPI
          label={<T fr="Avertissements" en="Warnings" />}
          value={String(warnings)}
          accent={warnings > 0 ? "var(--warning)" : "var(--ink)"}
        />
      </div>

      <SecurityLogTable events={events} />
    </div>
  );
}
