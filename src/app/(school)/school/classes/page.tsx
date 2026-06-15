import { PageHeader } from "@/components/KPI";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import { getClassDirectory } from "@/lib/school-db";

function tone(avg: number): string {
  return avg >= 14 ? "#1D6650" : avg >= 10 ? "#C28728" : "#C03A2B";
}

export default async function SchoolClasses() {
  const { rows, totalStudents, totalTeachers } = await getClassDirectory();

  const withAvg = rows.filter((r) => r.avg !== null) as (typeof rows[number] & { avg: number })[];
  const best = withAvg.length ? withAvg.reduce((a, b) => (b.avg > a.avg ? b : a)) : null;
  const worst = withAvg.length ? withAvg.reduce((a, b) => (b.avg < a.avg ? b : a)) : null;

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={{ fr: "Classes", en: "Classes" }}
        sub={{
          fr: `${totalStudents} élèves · ${totalTeachers} enseignants · ${rows.length} classes`,
          en: `${totalStudents} students · ${totalTeachers} teachers · ${rows.length} classes`,
        }}
      />

      {rows.length === 0 ? (
        <div className="ek-card" style={{ padding: 40, textAlign: "center", color: "var(--ink-3)" }}>
          <T fr="Aucune classe pour le moment." en="No class yet." />
        </div>
      ) : (
        <>
          {/* Taux de réussite par classe */}
          <div className="ek-card" style={{ padding: 20 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>
              <T fr="Taux de réussite par classe" en="Success rate by class" />
            </div>
            <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginBottom: 16 }}>
              <T
                fr="Moyenne générale de chaque classe — repérez les classes à soutenir avant les examens."
                en="Each class's overall average — spot classes needing support before exams."
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {rows.map((r) => {
                const a = r.avg ?? 0;
                return (
                  <div key={r.className} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 150, fontSize: 12.5, color: "var(--ink-2)", fontWeight: 600, flexShrink: 0 }}>
                      {r.className}
                    </div>
                    <div style={{ flex: 1, height: 18, borderRadius: 6, background: "var(--surface-2)", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${Math.min(100, (a / 20) * 100)}%`,
                          background: r.avg === null ? "var(--border-strong)" : tone(a),
                          borderRadius: 6,
                          transition: "width .3s",
                        }}
                      />
                    </div>
                    <div style={{ width: 54, textAlign: "right", fontSize: 13, fontWeight: 700, fontFamily: "var(--font-display)", color: r.avg === null ? "var(--ink-3)" : tone(a) }}>
                      {r.avg === null ? "—" : `${r.avg}/20`}
                    </div>
                  </div>
                );
              })}
            </div>

            {(best || worst) && (
              <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
                {best && (
                  <div style={{ flex: 1, minWidth: 180, padding: 12, borderRadius: 10, background: "rgba(29,102,80,0.08)" }}>
                    <div style={{ fontSize: 10.5, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
                      <T fr="Meilleure classe" en="Top class" />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1D6650", marginTop: 2 }}>
                      {best.className} · {best.avg}/20
                    </div>
                  </div>
                )}
                {worst && best && worst.className !== best.className && (
                  <div style={{ flex: 1, minWidth: 180, padding: 12, borderRadius: 10, background: "rgba(192,58,43,0.08)" }}>
                    <div style={{ fontSize: 10.5, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
                      <T fr="Classe à soutenir" en="Class to support" />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#C03A2B", marginTop: 2 }}>
                      {worst.className} · {worst.avg}/20
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Annuaire : effectifs par classe */}
          <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--divider)", fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>
              <T fr="Annuaire des classes" en="Class directory" />
            </div>
            <div className="ek-tablewrap">
              <div style={{ minWidth: 640 }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.4fr 0.8fr 0.8fr 2fr",
                    padding: "10px 18px",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--ink-3)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    background: "var(--surface-2)",
                  }}
                >
                  <div><T fr="Classe" en="Class" /></div>
                  <div style={{ textAlign: "center" }}><T fr="Élèves" en="Students" /></div>
                  <div style={{ textAlign: "center" }}><T fr="Profs" en="Teachers" /></div>
                  <div><T fr="Enseignants" en="Teachers" /></div>
                </div>
                {rows.map((r, i) => (
                  <div
                    key={r.className}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.4fr 0.8fr 0.8fr 2fr",
                      padding: "12px 18px",
                      alignItems: "center",
                      fontSize: 12.5,
                      borderTop: i > 0 ? "1px solid var(--divider)" : "none",
                    }}
                  >
                    <div style={{ fontWeight: 600, color: "var(--ink)" }}>{r.className}</div>
                    <div style={{ textAlign: "center", color: "var(--ink-2)", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                      <Icon name="user" size={13} /> {r.studentCount}
                    </div>
                    <div style={{ textAlign: "center", color: "var(--ink-2)", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                      <Icon name="users" size={13} /> {r.teacherCount}
                    </div>
                    <div style={{ color: "var(--ink-3)", fontSize: 11.5 }}>
                      {r.teacherNames.length > 0 ? r.teacherNames.join(", ") : "—"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
