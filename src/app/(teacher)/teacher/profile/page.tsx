import { PageHeader } from "@/components/KPI";
import { Avatar } from "@/components/Avatar";
import { T } from "@/lib/i18n";
import { getTeacherProfile, getTeacherSchool, listTeacherClasses } from "@/lib/teacher-db";

export default async function TeacherProfilePage() {
  const [profile, school, classes] = await Promise.all([
    getTeacherProfile(),
    getTeacherSchool(),
    listTeacherClasses(),
  ]);

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, maxWidth: 760 }}>
      <PageHeader title={{ fr: "Mon profil", en: "My profile" }} />

      <div className="ek-card" style={{ padding: 24, display: "flex", alignItems: "center", gap: 16 }}>
        <Avatar name={profile?.name ?? "?"} size={64} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-display)" }}>
            {profile?.name ?? "—"}
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 2 }}>{profile?.email ?? ""}</div>
          {school && (
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 8 }}>
              <T fr="École" en="School" /> : <span style={{ color: "var(--ink-2)", fontWeight: 600 }}>{school.name}</span>
            </div>
          )}
        </div>
      </div>

      <div className="ek-card" style={{ padding: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>
          <T fr="Mes classes" en="My classes" />
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {classes.map((c) => (
            <span key={c.className} className="ek-chip brand" style={{ padding: "6px 12px", fontSize: 13 }}>
              {c.className} · {c.studentCount}
            </span>
          ))}
          {classes.length === 0 && (
            <span style={{ fontSize: 12, color: "var(--ink-3)" }}><T fr="Aucune classe assignée." en="No class assigned." /></span>
          )}
        </div>
      </div>
    </div>
  );
}
