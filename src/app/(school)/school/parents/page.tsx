import { PageHeader } from "@/components/KPI";
import { Avatar } from "@/components/Avatar";
import { T } from "@/lib/i18n";
import { listSchoolParents } from "@/lib/school-db";
import { ParentAccessButton } from "./ParentAccessButton";
import { MarkPaidButton } from "./MarkPaidButton";
import { getParentFeeStatus } from "./actions";

export default async function SchoolParents() {
  const [parents, paidIds] = await Promise.all([listSchoolParents(), getParentFeeStatus()]);
  const paid = new Set(paidIds);
  const blocked = parents.filter((p) => p.status === "blocked").length;
  const paidCount = parents.filter((p) => paid.has(p.parentId)).length;

  const monthLabel = new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={{ fr: "Parents", en: "Parents" }}
        sub={{
          fr: `${parents.length} parent(s) · ${paidCount} payé(s) ce mois · ${blocked} bloqué(s)`,
          en: `${parents.length} parent(s) · ${paidCount} paid this month · ${blocked} blocked`,
        }}
      />

      <div style={{ fontSize: 12, color: "var(--ink-3)", lineHeight: 1.5 }}>
        <T
          fr={`Cotisation du mois : ${monthLabel}. « Marquer payé » enregistre les 5 $ et réactive l'accès du parent. Tu peux bloquer un parent qui n'a pas payé.`}
          en={`This month's fee: ${monthLabel}. “Mark paid” records the $5 and reactivates the parent's access. You can block a parent who hasn't paid.`}
        />
      </div>

      <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
        {parents.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
            <T
              fr="Aucun parent rattaché. Les parents apparaissent dès qu'ils sont liés à un élève."
              en="No linked parent yet. Parents show up once linked to a student."
            />
          </div>
        ) : (
          <div className="ek-tablewrap">
            <div style={{ minWidth: 820 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1.6fr 1.1fr 0.9fr 1fr",
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
                <div><T fr="Parent" en="Parent" /></div>
                <div><T fr="Enfant(s)" en="Child(ren)" /></div>
                <div><T fr="Cotisation" en="Fee" /></div>
                <div><T fr="Statut" en="Status" /></div>
                <div style={{ textAlign: "right" }}><T fr="Action" en="Action" /></div>
              </div>
              {parents.map((p, i) => (
                <div
                  key={p.parentId}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1.6fr 1.1fr 0.9fr 1fr",
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
                      <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{p.email}</div>
                    </div>
                  </div>
                  <div style={{ color: "var(--ink-3)", fontSize: 11.5 }}>
                    {p.students.length > 0 ? p.students.join(", ") : "—"}
                  </div>
                  <div>
                    <MarkPaidButton parentId={p.parentId} paid={paid.has(p.parentId)} />
                  </div>
                  <div>
                    {p.status === "blocked" ? (
                      <span className="ek-chip danger"><T fr="Bloqué" en="Blocked" /></span>
                    ) : (
                      <span className="ek-chip success"><T fr="Actif" en="Active" /></span>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <ParentAccessButton parentId={p.parentId} blocked={p.status === "blocked"} />
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
