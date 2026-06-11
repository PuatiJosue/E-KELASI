import { PageHeader } from "@/components/KPI";
import { Avatar } from "@/components/Avatar";
import { T } from "@/lib/i18n";
import { getPendingStudents } from "./actions";
import { RequestActions } from "./RequestActions";

function ageFrom(birth: string | null): string {
  if (!birth) return "—";
  const d = new Date(birth);
  if (isNaN(d.getTime())) return "—";
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age >= 0 && age < 100 ? `${age} ans` : "—";
}

export default async function SchoolRequests() {
  const pending = await getPendingStudents();

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={{ fr: "Demandes d'inscription", en: "Registration requests" }}
        sub={{ fr: `${pending.length} demande(s) en attente`, en: `${pending.length} pending request(s)` }}
      />

      <div style={{ fontSize: 12, color: "var(--ink-3)", lineHeight: 1.5 }}>
        <T
          fr="Les parents enregistrent leurs enfants. Vérifiez que l'élève est bien inscrit chez vous, puis validez (ou refusez)."
          en="Parents register their children. Confirm the student is enrolled here, then approve (or reject)."
        />
      </div>

      <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
        {pending.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
            <T fr="Aucune demande en attente." en="No pending request." />
          </div>
        ) : (
          <div className="ek-tablewrap">
            <div style={{ minWidth: 760 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1.6fr 1fr 1.4fr",
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
                <div><T fr="Élève" en="Student" /></div>
                <div><T fr="Parent" en="Parent" /></div>
                <div><T fr="Classe" en="Class" /></div>
                <div style={{ textAlign: "right" }}><T fr="Action" en="Action" /></div>
              </div>
              {pending.map((p, i) => (
                <div
                  key={p.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1.6fr 1fr 1.4fr",
                    padding: "12px 18px",
                    alignItems: "center",
                    fontSize: 12.5,
                    borderTop: i > 0 ? "1px solid var(--divider)" : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <Avatar name={p.fullName} size={32} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: "var(--ink)" }}>{p.fullName}</div>
                      <div style={{ fontSize: 11, color: "var(--ink-3)" }}>
                        {(p.sex === "M" ? "Garçon" : p.sex === "F" ? "Fille" : "—")} · {ageFrom(p.birthDate)}
                      </div>
                    </div>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: "var(--ink-2)", fontWeight: 600 }}>{p.parentName}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{p.parentPhone || p.parentEmail}</div>
                  </div>
                  <div style={{ color: "var(--ink-2)" }}>{p.className ?? "—"}</div>
                  <div style={{ textAlign: "right" }}>
                    <RequestActions studentId={p.id} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
