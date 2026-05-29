import Link from "next/link";
import { PageHeader } from "@/components/KPI";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import { listTeacherHomework } from "@/lib/teacher-db";

const STATUS_LABEL: Record<string, { fr: string; en: string; tone: string }> = {
  todo:       { fr: "À faire",     en: "To do",       tone: "warn" },
  inprogress: { fr: "En cours",    en: "In progress", tone: "info" },
  done:       { fr: "Terminé",     en: "Done",        tone: "success" },
  late:       { fr: "En retard",   en: "Late",        tone: "danger" },
};

export default async function HomeworkListPage() {
  const items = await listTeacherHomework();

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={{ fr: "Devoirs", en: "Homework" }}
        sub={{
          fr: `${items.length} devoirs créés`,
          en: `${items.length} homework created`,
        }}
        right={
          <Link href="/teacher/homework/new" className="ek-btn ek-btn-primary" style={{ height: 32, fontSize: 12 }}>
            <Icon name="plus" size={14} stroke={2.5} />
            <T fr="Nouveau devoir" en="New homework" />
          </Link>
        }
      />

      <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="ek-tablewrap">
        <div style={{ minWidth: 680 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
            padding: "12px 18px",
            fontSize: 11,
            fontWeight: 700,
            color: "var(--ink-3)",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            background: "var(--surface-2)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div><T fr="Titre" en="Title" /></div>
          <div><T fr="Matière" en="Subject" /></div>
          <div><T fr="Classe" en="Class" /></div>
          <div><T fr="Échéance" en="Due" /></div>
          <div><T fr="Statut" en="Status" /></div>
        </div>
        {items.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--ink-3)", fontSize: 12 }}>
            <T fr="Aucun devoir créé pour l'instant." en="No homework yet." />
          </div>
        ) : (
          items.map((h, i) => {
            const lbl = STATUS_LABEL[h.status] ?? { fr: h.status, en: h.status, tone: "" };
            return (
              <div
                key={h.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                  padding: "14px 18px",
                  alignItems: "center",
                  fontSize: 12.5,
                  borderBottom: i < items.length - 1 ? "1px solid var(--divider)" : "none",
                }}
              >
                <div style={{ fontWeight: 600, color: "var(--ink)" }}>{h.title}</div>
                <div style={{ color: "var(--ink-2)" }}>{h.subjectName}</div>
                <div style={{ color: "var(--ink-2)" }}>{h.className}</div>
                <div style={{ color: "var(--ink-3)" }}>{h.dueAt}</div>
                <div>
                  <span className={`ek-chip ${lbl.tone}`}>
                    <T fr={lbl.fr} en={lbl.en} />
                  </span>
                </div>
              </div>
            );
          })
        )}
        </div>
        </div>
      </div>
    </div>
  );
}
