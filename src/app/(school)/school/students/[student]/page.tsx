import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import { getStudentDossier } from "@/lib/school-db";
import { currentTrimester } from "@/lib/trimester";
import { listStudentPayments } from "@/lib/finance-db";
import { PaymentManager } from "./PaymentManager";

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

function fmtDate(birth: string | null): string {
  if (!birth) return "—";
  const d = new Date(birth);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

const sexLabel = (s: string | null) => (s === "M" ? "Masculin" : s === "F" ? "Féminin" : "—");

export default async function StudentDossierPage({ params }: { params: { student: string } }) {
  const [d, payments] = await Promise.all([
    getStudentDossier(params.student),
    listStudentPayments(params.student),
  ]);

  if (!d) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--ink-3)" }}>
        <T fr="Dossier introuvable." en="Record not found." />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/school/students" className="ek-btn ek-btn-outline" style={{ height: 32, fontSize: 12 }}>
          <Icon name="chevL" size={14} />
          <T fr="Élèves" en="Students" />
        </Link>
        <Link href={`/school/reports/${d.id}`} className="ek-btn ek-btn-primary" style={{ height: 32, fontSize: 12 }}>
          <Icon name="file" size={13} />
          <T fr="Bulletin" en="Report card" />
        </Link>
      </div>

      {/* Identité */}
      <div className="ek-card" style={{ padding: 20, display: "flex", alignItems: "center", gap: 16 }}>
        <Avatar name={d.fullName} url={d.avatarUrl} size={64} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-display)" }}>{d.fullName}</div>
          <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 2 }}>
            {[d.className, d.option, d.schoolName].filter(Boolean).join(" · ")}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10.5, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
            <T fr="Moyenne générale" en="Overall avg" />
          </div>
          <div style={{ fontSize: 30, fontWeight: 700, color: "var(--brand-600)", fontFamily: "var(--font-display)" }}>
            {d.overallAvg}<span style={{ fontSize: 13, color: "var(--ink-3)" }}>/20</span>
          </div>
        </div>
      </div>

      {/* Infos + Parents */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="ek-card" style={{ padding: 18 }}>
          <SectionTitle fr="Informations" en="Information" />
          <InfoRow label="Sexe" value={sexLabel(d.sex)} />
          <InfoRow label="Date de naissance" value={fmtDate(d.birthDate)} />
          <InfoRow label="Âge" value={ageFrom(d.birthDate)} />
          <InfoRow label="Classe" value={d.className} />
          {d.option && <InfoRow label="Option" value={d.option} />}
          <InfoRow label="Statut" value={d.status === "active" ? "Actif" : d.status === "pending" ? "En attente" : "Refusé"} />
        </div>

        <div className="ek-card" style={{ padding: 18 }}>
          <SectionTitle fr="Parents / Tuteurs" en="Parents / Guardians" />
          {d.parents.length === 0 ? (
            <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>
              <T fr="Aucun parent lié." en="No linked parent." />
            </div>
          ) : (
            d.parents.map((p, i) => (
              <div key={i} style={{ padding: "8px 0", borderTop: i > 0 ? "1px solid var(--divider)" : "none" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
                  {p.name}
                  {p.access === "blocked" && (
                    <span style={{ marginLeft: 8, fontSize: 10.5, color: "var(--danger)", fontWeight: 700 }}>· bloqué</span>
                  )}
                </div>
                <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{p.phone || p.email || "—"}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Frais scolaires / minerval */}
      <PaymentManager studentId={d.id} payments={payments} />

      {/* Cotations regroupées par trimestre (dossiers) */}
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
    </div>
  );
}

function SectionTitle({ fr, en }: { fr: string; en: string }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
      <T fr={fr} en={en} />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", fontSize: 13, borderTop: "1px solid var(--divider)" }}>
      <span style={{ color: "var(--ink-3)" }}>{label}</span>
      <span style={{ color: "var(--ink)", fontWeight: 600 }}>{value}</span>
    </div>
  );
}
