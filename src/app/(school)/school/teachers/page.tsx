import { PageHeader } from "@/components/KPI";
import { Avatar } from "@/components/Avatar";
import { T } from "@/lib/i18n";
import { listSchoolTeachers } from "@/lib/school-db";
import { InviteTeacherButton } from "@/components/school/InviteTeacherButton";

export default async function SchoolTeachers() {
  const teachers = await listSchoolTeachers();
  const teacherCount = teachers.filter((t) => t.role === "teacher").length;
  const adminCount = teachers.filter((t) => t.role === "school_admin").length;

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={{ fr: "Équipe pédagogique", en: "Teaching staff" }}
        sub={{
          fr: `${teacherCount} professeurs · ${adminCount} membre(s) direction`,
          en: `${teacherCount} teachers · ${adminCount} admin(s)`,
        }}
        right={<InviteTeacherButton />}
      />

      <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="ek-tablewrap">
        <div style={{ minWidth: 620 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 2fr 1fr 1fr",
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
          <div><T fr="Nom" en="Name" /></div>
          <div><T fr="Email" en="Email" /></div>
          <div><T fr="Rôle" en="Role" /></div>
          <div><T fr="Depuis" en="Since" /></div>
        </div>
        {teachers.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--ink-3)", fontSize: 12 }}>
            <T fr="Aucun membre dans l'équipe." en="No team members yet." />
          </div>
        ) : (
          teachers.map((t, i) => (
            <div
              key={t.id || i}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 2fr 1fr 1fr",
                padding: "14px 18px",
                alignItems: "center",
                fontSize: 12.5,
                borderBottom: i < teachers.length - 1 ? "1px solid var(--divider)" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar name={t.fullName} size={32} />
                <span style={{ fontWeight: 600, color: "var(--ink)" }}>{t.fullName}</span>
              </div>
              <div style={{ color: "var(--ink-2)" }}>{t.email}</div>
              <div>
                <span className={`ek-chip ${t.role === "school_admin" ? "brand" : ""}`}>
                  {t.role === "school_admin" ? "Direction" : "Professeur"}
                </span>
              </div>
              <div style={{ color: "var(--ink-3)" }}>{t.joinedAt}</div>
            </div>
          ))
        )}
        </div>
        </div>
      </div>
    </div>
  );
}
