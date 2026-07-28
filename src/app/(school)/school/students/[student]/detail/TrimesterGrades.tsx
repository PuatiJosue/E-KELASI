// Cotations regroupées par trimestre.

import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import { currentTrimester } from "@/lib/trimester";
import { SectionTitle } from "./ui";
import type { StudentDossier } from "@/lib/school/dossier";

export function TrimesterGrades({ d }: { d: StudentDossier }) {
  return (
    <>
  {d.trimesters.length === 0 ? (
          <div className="ek-card" style={{ padding: 18 }}>
            <SectionTitle fr="Cotations par trimestre" en="Grades by term" />
            <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>
              <T fr="Pas encore de notes saisies." en="No grades yet." />
            </div>
          </div>
        ) : (
          d.trimesters.map((tri) => {
            const current = tri.index === currentTrimester();
            return (
              <div key={tri.index} className="ek-card" style={{ padding: 18 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Icon name="file" size={14} style={{ color: "var(--ink-3)" }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-display)" }}>
                      <T fr={tri.fr} en={tri.en} />
                    </span>
                    {current && (
                      <span className="ek-chip info" style={{ fontSize: 10 }}>
                        <T fr="En cours" en="Current" />
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
                    <T fr="Moyenne" en="Average" />{" "}
                    <strong style={{ color: tri.overallAvg >= 14 ? "#1D6650" : tri.overallAvg >= 10 ? "#C28728" : "#C03A2B" }}>
                      {tri.overallAvg.toFixed(1)}/20
                    </strong>
                  </div>
                </div>
                <div className="ek-tablewrap">
                  <div style={{ minWidth: 480 }}>
                    {tri.subjects.map((s, i) => (
                      <div
                        key={s.name}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "2fr 2fr 0.7fr",
                          padding: "10px 0",
                          alignItems: "center",
                          borderTop: i > 0 ? "1px solid var(--divider)" : "none",
                          fontSize: 12.5,
                        }}
                      >
                        <div style={{ fontWeight: 600, color: "var(--ink)" }}>{s.name}</div>
                        <div style={{ fontSize: 11, color: "var(--ink-3)" }}>
                          {s.items.length} évaluation(s)
                        </div>
                        <div style={{ textAlign: "right", fontWeight: 700, fontFamily: "var(--font-display)", color: s.avg >= 14 ? "#1D6650" : s.avg >= 10 ? "#C28728" : "#C03A2B" }}>
                          {s.avg.toFixed(1)}<span style={{ fontSize: 10, color: "var(--ink-3)" }}>/20</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
    </>
  );
}
