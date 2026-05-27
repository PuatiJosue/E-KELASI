import Link from "next/link";
import { PageHeader } from "@/components/KPI";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import { listSchoolStudents } from "@/lib/school-db";

export default async function SchoolReports() {
  const students = await listSchoolStudents();

  const grouped: Record<string, typeof students> = {};
  for (const s of students) (grouped[s.className] ||= []).push(s);
  const classes = Object.keys(grouped).sort();

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={{ fr: "Bulletins", en: "Report cards" }}
        sub={{
          fr: "Génère un bulletin imprimable par élève (Ctrl+P depuis le bulletin).",
          en: "Generate a printable report card per student (Ctrl+P from the report).",
        }}
      />

      {classes.map((c) => (
        <div key={c} className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--divider)", display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "var(--brand-soft)",
                color: "var(--brand-600)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 700,
                fontFamily: "var(--font-display)",
              }}
            >
              {c.split(" ").map((w) => w[0]).join("").slice(0, 2)}
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>{c}</div>
            <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{grouped[c].length} bulletins</div>
          </div>
          {grouped[c].map((s, i) => (
            <Link
              key={s.id}
              href={`/school/reports/${s.id}`}
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr auto auto",
                gap: 14,
                padding: "12px 18px",
                alignItems: "center",
                borderTop: i > 0 ? "1px solid var(--divider)" : "none",
              }}
            >
              <Avatar name={s.fullName} size={32} />
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>{s.fullName}</div>
              <div style={{ fontSize: 12, color: "var(--ink-2)" }}>
                <T fr="Moyenne" en="Avg" /> : <span style={{ fontWeight: 700 }}>{s.avg !== null ? `${s.avg}/20` : "—"}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--brand-600)", fontSize: 12, fontWeight: 600 }}>
                <Icon name="file" size={14} />
                <T fr="Ouvrir le bulletin" en="Open report" />
              </div>
            </Link>
          ))}
        </div>
      ))}

      {students.length === 0 && (
        <div className="ek-card" style={{ padding: 40, textAlign: "center", color: "var(--ink-3)" }}>
          <T fr="Aucun élève." en="No students." />
        </div>
      )}
    </div>
  );
}
