import Link from "next/link";
import { KPI, PageHeader } from "@/components/KPI";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import { getMySchool, getSchoolKpis, listClassesWithAvg } from "@/lib/school-db";
import { getPlatformForSchools } from "@/lib/platform-db";

export default async function SchoolOverview() {
  const [school, kpis, classes, platform] = await Promise.all([
    getMySchool(),
    getSchoolKpis(),
    listClassesWithAvg(),
    getPlatformForSchools(),
  ]);

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
      <PageHeader
        title={{
          fr: `Bonjour, ${school?.name ?? "votre école"}.`,
          en: `Hello, ${school?.name ?? "your school"}.`,
        }}
        sub={{
          fr: school ? `${school.city}, ${school.countryCode} · plan ${school.plan === "pro" ? "Pro" : "Standard"}` : "",
          en: school ? `${school.city}, ${school.countryCode} · ${school.plan === "pro" ? "Pro" : "Standard"} plan` : "",
        }}
        right={
          <Link href="/school/classes" className="ek-btn ek-btn-outline" style={{ height: 32, fontSize: 12 }}>
            <Icon name="plus" size={14} stroke={2.5} />
            <T fr="Inviter un prof" en="Invite teacher" />
          </Link>
        }
      />

      {platform.map((a) => (
        <div key={a.id} className="ek-card" style={{ padding: 16, borderLeft: "3px solid var(--brand)", display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "var(--brand-soft)", color: "var(--brand-600)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="bell" size={16} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 10.5, color: "var(--ink-3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Annonce E-KLASS</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", marginTop: 1 }}>{a.title}</div>
            <div style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 2, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{a.body}</div>
          </div>
        </div>
      ))}

      <div className="ek-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        <KPI label={<T fr="Élèves" en="Students" />} value={String(kpis.students)} sub={<T fr={`${kpis.classes} classes`} en={`${kpis.classes} classes`} />} />
        <KPI label={<T fr="Professeurs" en="Teachers" />} value={String(kpis.teachers)} sub={<T fr="dans votre école" en="in your school" />} />
        <KPI label={<T fr="Parents abonnés" en="Paying parents" />} value={String(kpis.parentsPaying)} accent="var(--accent)" sub={<T fr="essai + actifs" en="trial + active" />} />
      </div>

      <div className="ek-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
        <KPI label={<T fr="Notes saisies ce mois" en="Grades this month" />} value={String(kpis.gradesThisMonth)} sub={<T fr="par tous les profs" en="by all teachers" />} />
        <KPI label={<T fr="Devoirs actifs" en="Active homework" />} value={String(kpis.homeworkActive)} accent="var(--brand-600)" sub={<T fr="à rendre" en="pending" />} />
      </div>

      {/* Classes overview */}
      <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--divider)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
            <T fr="Classes" en="Classes" />
          </div>
          <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>
            <T fr="Vue d'ensemble par classe" en="Per-class overview" />
          </div>
        </div>
        {classes.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--ink-3)", fontSize: 12 }}>
            <T fr="Aucune classe pour l'instant." en="No class yet." />
          </div>
        ) : (
          classes.map((c, i) => (
            <div
              key={c.label}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto auto",
                gap: 14,
                alignItems: "center",
                padding: "14px 20px",
                borderTop: i > 0 ? "1px solid var(--divider)" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
                    fontWeight: 700,
                    fontSize: 12,
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {c.label.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>{c.label}</div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{c.studentCount} <T fr="élèves" en="students" /></div>
                </div>
              </div>
              <div>
                {c.avg !== null ? (
                  <span className={`ek-chip ${c.avg >= 14 ? "success" : c.avg >= 10 ? "warn" : "danger"}`}>
                    {c.avg.toFixed(1)}/20
                  </span>
                ) : (
                  <span className="ek-chip"><T fr="Pas de notes" en="No grades" /></span>
                )}
              </div>
              <Link href="/school/students" style={{ color: "var(--brand-600)", fontSize: 12, fontWeight: 600 }}>
                <T fr="Détails" en="Details" /> →
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
