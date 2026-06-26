import Link from "next/link";
import { PageHeader } from "@/components/KPI";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import { listTeacherClasses } from "@/lib/teacher-db";

export default async function ClassesPage() {
  const classes = await listTeacherClasses();

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={{ fr: "Mes classes", en: "My classes" }}
        sub={{
          fr: `${classes.length} classes · clique sur une classe pour voir les élèves`,
          en: `${classes.length} classes · click a class to see students`,
        }}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
        {classes.map((c) => (
          <Link
            key={c.key}
            href={`/teacher/classes/${encodeURIComponent(c.className)}?option=${encodeURIComponent(c.option ?? "")}`}
            className="ek-card"
            style={{ padding: 18, display: "flex", alignItems: "center", gap: 14 }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: "var(--brand-soft)",
                color: "var(--brand-600)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "var(--font-display)",
              }}
            >
              {c.label.split(" ").map((w) => w[0]).join("").slice(0, 2)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-display)" }}>{c.label}</div>
              <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
                {c.studentCount} <T fr="élèves" en="students" />
              </div>
            </div>
            <Icon name="chevR" size={18} style={{ color: "var(--ink-3)" }} />
          </Link>
        ))}
      </div>

      {classes.length === 0 && (
        <div className="ek-card" style={{ padding: 40, textAlign: "center", color: "var(--ink-3)" }}>
          <T fr="Aucune classe assignée. Contacte ta direction." en="No class assigned. Contact your school admin." />
        </div>
      )}
    </div>
  );
}
