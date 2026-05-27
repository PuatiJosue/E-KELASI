import { PageHeader } from "@/components/KPI";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";

export default function TeacherSettings() {
  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, maxWidth: 760 }}>
      <PageHeader title={{ fr: "Paramètres", en: "Settings" }} />

      <div className="ek-card" style={{ padding: 18 }}>
        <Row
          icon="bell"
          label={<T fr="Notifications" en="Notifications" />}
          desc={<T fr="Email + push à la création de devoirs/notes" en="Email + push when grades/homework created" />}
          value="Tout"
        />
        <Row
          icon="mail"
          label={<T fr="Langue" en="Language" />}
          desc={<T fr="Interface E-KELASI" en="E-KELASI interface" />}
          value="FR"
        />
        <Row
          icon="moon"
          label={<T fr="Apparence" en="Appearance" />}
          desc={<T fr="Suit ton système" en="Follows system" />}
          value="Auto"
          last
        />
      </div>
    </div>
  );
}

function Row({ icon, label, desc, value, last }: { icon: string; label: React.ReactNode; desc: React.ReactNode; value: string; last?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 0",
        borderBottom: last ? "none" : "1px solid var(--divider)",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: "var(--surface-2)",
          color: "var(--ink-2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name={icon} size={16} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>{label}</div>
        <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>{desc}</div>
      </div>
      <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{value}</span>
      <Icon name="chevR" size={16} style={{ color: "var(--ink-4)" }} />
    </div>
  );
}
