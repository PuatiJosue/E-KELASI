import { KPI, PageHeader } from "@/components/KPI";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import { listAuditLogs } from "@/lib/db";
import { SecurityLogTable } from "@/components/admin/SecurityLogTable";

export default async function SecurityPage() {
  const events = await listAuditLogs(50);

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={{ fr: "Sécurité & journaux", en: "Security & logs" }}
        sub={{
          fr: "Journal d'audit · ressources & événements plateforme",
          en: "Audit log · resources & platform events",
        }}
        right={
          <button className="ek-btn ek-btn-outline" style={{ height: 32, fontSize: 12 }}>
            <Icon name="download" size={13} /> <T fr="Exporter logs" en="Export logs" />
          </button>
        }
      />

      <div className="ek-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        <KPI
          label={<T fr="Statut système" en="System status" />}
          value={
            <>
              <span style={{ color: "var(--accent)" }}>●</span> Healthy
            </>
          }
          sub={<T fr="Uptime 99.98% · 30j" en="Uptime 99.98% · 30d" />}
        />
        <KPI
          label={<T fr="Sessions actives" en="Active sessions" />}
          value="4 312"
          sub={<T fr="parents · profs · admins" en="parents · teachers · admins" />}
        />
        <KPI
          label={<T fr="Alertes ouvertes" en="Open alerts" />}
          value="3"
          accent="var(--warning)"
          sub={<T fr="1 critique · 2 warnings" en="1 critical · 2 warnings" />}
        />
        <KPI
          label={<T fr="RGPD" en="GDPR" />}
          value={
            <>
              <Icon
                name="check"
                size={20}
                stroke={3}
                style={{ verticalAlign: -3, color: "var(--accent)" }}
              />{" "}
              Compliant
            </>
          }
          sub={<T fr="Audit Q1 2026 passé" en="Q1 2026 audit passed" />}
        />
      </div>

      <SecurityLogTable events={events} />
    </div>
  );
}
