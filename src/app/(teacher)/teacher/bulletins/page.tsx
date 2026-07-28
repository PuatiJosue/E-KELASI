import Link from "next/link";
import { PageHeader } from "@/components/KPI";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import { listTeacherClasses, listStudentsInClass } from "@/lib/teacher/classes";

export const dynamic = "force-dynamic";

export default async function TeacherBulletinsIndex() {
  const classes = await listTeacherClasses();
  const withStudents = await Promise.all(
    classes.map(async (c) => ({ key: c.key, label: c.label, students: await listStudentsInClass(c.className, c.option) }))
  );

  const total = withStudents.reduce((a, c) => a + c.students.length, 0);

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={{ fr: "Bulletins", en: "Report cards" }}
        sub={{
          fr: "Encode le bulletin d'un élève, puis enregistre. L'envoi aux parents est fait par l'école.",
          en: "Encode a student's report then save. Sending to parents is done by the school.",
        }}
      />

      {total === 0 ? (
        <div className="ek-card" style={{ padding: 32, textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
          <T fr="Aucun élève dans tes classes." en="No students in your classes." />
        </div>
      ) : (
        withStudents.map((c) => (
          <div key={c.key} className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--divider)", fontSize: 13, fontWeight: 700, color: "var(--ink)", background: "var(--surface-2)" }}>
              {c.label} <span style={{ color: "var(--ink-3)", fontWeight: 500 }}>· {c.students.length} <T fr="élèves" en="students" /></span>
            </div>
            {c.students.length === 0 ? (
              <div style={{ padding: 18, fontSize: 12.5, color: "var(--ink-3)" }}>
                <T fr="Aucun élève." en="No students." />
              </div>
            ) : (
              c.students.map((s, i) => (
                <Link
                  key={s.id}
                  href={`/teacher/bulletins/${s.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 18px",
                    borderBottom: i < c.students.length - 1 ? "1px solid var(--divider)" : "none",
                  }}
                >
                  <Avatar name={s.fullName} url={s.avatarUrl} size={32} />
                  <span style={{ flex: 1, fontWeight: 600, color: "var(--ink)", fontSize: 13.5 }}>{s.fullName}</span>
                  <span className="ek-btn ek-btn-outline" style={{ height: 28, fontSize: 11.5 }}>
                    <Icon name="file" size={12} />
                    <T fr="Encoder" en="Encode" />
                  </span>
                </Link>
              ))
            )}
          </div>
        ))
      )}
    </div>
  );
}
