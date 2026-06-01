import { PageHeader } from "@/components/KPI";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import Link from "next/link";
import { listSchoolStudents } from "@/lib/school-db";
import { AddStudentButton } from "@/components/school/AddStudentButton";

export default async function SchoolStudents() {
  const students = await listSchoolStudents();

  // group by class
  const grouped: Record<string, typeof students> = {};
  for (const s of students) {
    (grouped[s.className] ||= []).push(s);
  }
  const classes = Object.keys(grouped).sort();

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={{ fr: "Élèves", en: "Students" }}
        sub={{
          fr: `${students.length} élèves dans ${classes.length} classes`,
          en: `${students.length} students in ${classes.length} classes`,
        }}
        right={
          <>
            <button className="ek-btn ek-btn-outline" style={{ height: 32, fontSize: 12 }}>
              <Icon name="upload" size={13} /> CSV
            </button>
            <AddStudentButton />
          </>
        }
      />

      {classes.map((c) => (
        <div key={c} className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
          <div
            style={{
              padding: "12px 18px",
              borderBottom: "1px solid var(--divider)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
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
            <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{grouped[c].length} élèves</div>
          </div>
          <div className="ek-tablewrap">
          <div style={{ minWidth: 520 }}>
          {grouped[c].map((s, i) => (
            <div
              key={s.id}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1.5fr 0.7fr 0.8fr",
                padding: "12px 18px",
                alignItems: "center",
                fontSize: 12.5,
                borderTop: i > 0 ? "1px solid var(--divider)" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar name={s.fullName} url={s.avatarUrl} size={32} />
                <span style={{ fontWeight: 600, color: "var(--ink)" }}>{s.fullName}</span>
              </div>
              <div style={{ color: "var(--ink-3)", fontSize: 11.5 }}>
                {s.parentNames.length > 0 ? s.parentNames.join(", ") : "—"}
              </div>
              <div style={{ color: "var(--ink-2)" }}>
                {s.avg !== null ? `${s.avg}/20` : "—"}
              </div>
              <div style={{ textAlign: "right" }}>
                <Link
                  href={`/school/reports?student=${s.id}`}
                  style={{ fontSize: 11.5, color: "var(--brand-600)", fontWeight: 600 }}
                >
                  <T fr="Bulletin" en="Report card" /> →
                </Link>
              </div>
            </div>
          ))}
          </div>
          </div>
        </div>
      ))}

      {students.length === 0 && (
        <div className="ek-card" style={{ padding: 40, textAlign: "center", color: "var(--ink-3)" }}>
          <T fr="Aucun élève. Ajoutez-en avec le bouton ci-dessus." en="No students. Add some with the button above." />
        </div>
      )}
    </div>
  );
}
