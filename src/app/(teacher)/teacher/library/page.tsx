import { PageHeader } from "@/components/KPI";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import { listSchoolLibrary } from "@/lib/teacher-db";

export default async function TeacherLibrary() {
  const books = await listSchoolLibrary();

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={{ fr: "Bibliothèque", en: "Library" }}
        sub={{
          fr: `${books.length} livres · catalogue géré par E-KELASI`,
          en: `${books.length} books · catalog managed by E-KELASI`,
        }}
      />

      {books.length === 0 ? (
        <div className="ek-card" style={{ padding: 40, textAlign: "center", color: "var(--ink-3)" }}>
          <Icon name="book" size={32} />
          <div style={{ marginTop: 12, fontSize: 13 }}>
            <T fr="Aucun livre pour le moment." en="No books yet." />
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
          {books.map((b) => (
            <div key={b.id} className="ek-card" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Cover */}
              <div
                style={{
                  height: 140,
                  borderRadius: 10,
                  background: b.coverUrl ? `center / cover no-repeat url("${b.coverUrl}")` : (b.subjectColor ?? "var(--brand)") + "22",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {!b.coverUrl && (
                  <Icon name="book" size={40} color={b.subjectColor ?? "var(--brand-600)"} />
                )}
                {b.subjectName && (
                  <span
                    style={{
                      position: "absolute",
                      top: 8,
                      left: 8,
                      padding: "3px 8px",
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.9)",
                      color: b.subjectColor ?? "var(--ink)",
                      fontSize: 10.5,
                      fontWeight: 700,
                      backdropFilter: "blur(6px)",
                    }}
                  >
                    {b.subjectName}
                  </span>
                )}
                {b.gradeLevel && (
                  <span
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      padding: "3px 8px",
                      borderRadius: 999,
                      background: "rgba(0,0,0,0.6)",
                      color: "white",
                      fontSize: 10.5,
                      fontWeight: 700,
                    }}
                  >
                    {b.gradeLevel}
                  </span>
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-display)", lineHeight: 1.25 }}>
                  {b.title}
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>{b.author}</div>
                {b.description && (
                  <div style={{ fontSize: 11.5, color: "var(--ink-2)", marginTop: 6, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {b.description}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid var(--divider)" }}>
                <div style={{ fontSize: 10.5, color: "var(--ink-3)" }}>
                  <T fr="par" en="by" /> <span style={{ color: "var(--ink-2)", fontWeight: 600 }}>{b.addedBy}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
