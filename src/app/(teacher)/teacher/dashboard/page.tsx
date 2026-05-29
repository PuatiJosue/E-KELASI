import Link from "next/link";
import { KPI, PageHeader } from "@/components/KPI";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import {
  getTeacherProfile,
  getTeacherSchool,
  listTeacherClasses,
  listTeacherRecentGrades,
  listTeacherHomework,
} from "@/lib/teacher-db";

export default async function TeacherDashboard() {
  const [profile, school, classes, recentGrades, homework] = await Promise.all([
    getTeacherProfile(),
    getTeacherSchool(),
    listTeacherClasses(),
    listTeacherRecentGrades(5),
    listTeacherHomework(),
  ]);

  const todoCount = homework.filter((h) => h.status === "todo" || h.status === "inprogress").length;

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
      <PageHeader
        title={{
          fr: `Bonjour ${profile?.name?.split(" ").slice(-1)[0] ?? ""}.`,
          en: `Hi ${profile?.name?.split(" ").slice(-1)[0] ?? ""}.`,
        }}
        sub={{
          fr: school ? `${school.name} · ${school.city}` : "",
          en: school ? `${school.name} · ${school.city}` : "",
        }}
        right={
          <>
            <Link href="/teacher/grades" className="ek-btn ek-btn-outline" style={{ height: 32, fontSize: 12 }}>
              <Icon name="plus" size={14} stroke={2.5} />
              <T fr="Saisir une note" en="Enter a grade" />
            </Link>
            <Link href="/teacher/homework/new" className="ek-btn ek-btn-primary" style={{ height: 32, fontSize: 12 }}>
              <Icon name="plus" size={14} stroke={2.5} />
              <T fr="Nouveau devoir" en="New homework" />
            </Link>
          </>
        }
      />

      <div className="ek-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        <KPI label={<T fr="Mes classes" en="My classes" />} value={String(classes.length)} sub={<T fr="cette année" en="this year" />} />
        <KPI label={<T fr="Total élèves" en="Total students" />} value={String(school?.totalStudents ?? 0)} sub={school?.name ?? ""} />
        <KPI label={<T fr="Notes saisies" en="Grades entered" />} value={String(recentGrades.length)} sub={<T fr="dernières en date" en="latest" />} />
        <KPI label={<T fr="Devoirs en cours" en="Homework active" />} value={String(todoCount)} accent="var(--brand-600)" sub={<T fr="à rendre" en="pending" />} />
      </div>

      <div className="ek-stack-md" style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 14 }}>
        {/* Recent grades */}
        <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--divider)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
                <T fr="Dernières notes saisies" en="Recently entered grades" />
              </div>
              <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>
                <T fr="Tes 5 dernières évaluations" en="Your 5 latest assessments" />
              </div>
            </div>
            <Link href="/teacher/grades" style={{ fontSize: 12, color: "var(--brand-600)", fontWeight: 600 }}>
              <T fr="Voir tout" en="View all" /> →
            </Link>
          </div>
          {recentGrades.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: "var(--ink-3)", fontSize: 12 }}>
              <T fr="Aucune note saisie pour l'instant." en="No grades entered yet." />
            </div>
          ) : (
            recentGrades.map((g, i) => {
              const pct = g.score / g.max;
              const tone = pct >= 0.75 ? "var(--accent)" : pct >= 0.5 ? "var(--warning)" : "var(--danger)";
              return (
                <div
                  key={g.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto",
                    gap: 12,
                    alignItems: "center",
                    padding: "12px 20px",
                    borderTop: i > 0 ? "1px solid var(--divider)" : "none",
                  }}
                >
                  <Avatar name={g.studentName} size={32} />
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>{g.studentName}</div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
                      {g.subjectName} · {g.kind} · {g.gradedAt}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: tone, fontFamily: "var(--font-display)" }}>
                      {g.score}<span style={{ fontSize: 10, color: "var(--ink-3)" }}>/{g.max}</span>
                    </div>
                    <div style={{ fontSize: 10, color: "var(--ink-3)" }}>coef. {g.coefficient}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Classes */}
        <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--divider)" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
              <T fr="Mes classes" en="My classes" />
            </div>
          </div>
          {classes.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: "var(--ink-3)", fontSize: 12 }}>
              <T fr="Aucune classe assignée." en="No class assigned." />
            </div>
          ) : (
            classes.map((c, i) => (
              <Link
                key={c.className}
                href={`/teacher/classes/${encodeURIComponent(c.className)}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 20px",
                  borderTop: i > 0 ? "1px solid var(--divider)" : "none",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "var(--brand-soft)",
                    color: "var(--brand-600)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {c.className.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>{c.className}</div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{c.studentCount} <T fr="élèves" en="students" /></div>
                </div>
                <Icon name="chevR" size={16} style={{ color: "var(--ink-3)" }} />
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
