import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { SchoolLetterhead } from "@/components/school/SchoolLetterhead";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import { getStudentReportData, getMySchool } from "@/lib/school-db";
import { TRIMESTERS, currentTrimester, schoolYearLabel } from "@/lib/trimester";
import { PrintButton } from "@/components/school/PrintButton";
import { PublishButton } from "./PublishButton";

export default async function StudentReport({
  params,
  searchParams,
}: {
  params: { student: string };
  searchParams: { t?: string };
}) {
  const selectedTri = Number(searchParams.t) || currentTrimester();
  const [data, school] = await Promise.all([
    getStudentReportData(params.student, selectedTri),
    getMySchool(),
  ]);

  if (!data) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--ink-3)" }}>
        <T fr="Bulletin introuvable." en="Report card not found." />
      </div>
    );
  }

  const { student, subjects, overallAvg } = data;
  const period = `${data.trimester.fr} · ${schoolYearLabel()}`;

  return (
    <div style={{ padding: 24, maxWidth: 880, margin: "0 auto" }}>
      {/* Toolbar (hidden on print) */}
      <div
        className="report-toolbar"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <Link href="/school/reports" className="ek-btn ek-btn-outline" style={{ height: 32, fontSize: 12 }}>
          <Icon name="chevL" size={14} />
          <T fr="Retour" en="Back" />
        </Link>
        <div style={{ display: "flex", gap: 4, alignItems: "center", background: "var(--surface-2)", borderRadius: 9, padding: 3 }}>
          {TRIMESTERS.map((m) => {
            const on = m.index === selectedTri;
            return (
              <Link
                key={m.index}
                href={`/school/reports/${params.student}?t=${m.index}`}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "5px 12px",
                  borderRadius: 7,
                  color: on ? "var(--ink)" : "var(--ink-3)",
                  background: on ? "var(--surface)" : "transparent",
                }}
              >
                {m.short}
              </Link>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <PublishButton studentId={params.student} period={period} trimester={selectedTri} hasSignature={!!school?.signatureUrl || !!school?.directorName} />
          <PrintButton />
        </div>
      </div>

      {/* Bulletin */}
      <div
        className="report-paper"
        style={{
          background: "white",
          padding: 40,
          borderRadius: 12,
          border: "1px solid var(--border)",
          color: "#1a1410",
        }}
      >
        {/* En-tête officiel de l'école */}
        <SchoolLetterhead
          name={student.schoolName}
          subtitle={student.schoolCity}
          logoUrl={school?.logoUrl}
          rightTitle="Bulletin scolaire"
          rightValue={period}
        />

        {/* Élève */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: 16,
            borderRadius: 10,
            background: "#FDF3E7",
            border: "1px solid #F9DDB8",
            marginBottom: 20,
          }}
        >
          <Avatar name={student.fullName} size={48} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#1a1410", fontFamily: "var(--font-display)" }}>
              {student.fullName}
            </div>
            <div style={{ fontSize: 12.5, color: "#4a3f35" }}>
              <T fr="Classe" en="Class" /> : <strong>{student.className}</strong>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "#8a7c6e", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
              <T fr="Moyenne générale" en="Overall avg" />
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: "#E0701E", fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}>
              {overallAvg}
              <span style={{ fontSize: 14, color: "#8a7c6e" }}>/20</span>
            </div>
          </div>
        </div>

        {/* Notes par matière */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1410", marginBottom: 10, fontFamily: "var(--font-display)" }}>
            <T fr="Détail par matière" en="Subject breakdown" />
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead>
              <tr style={{ background: "#F4EFE3", textAlign: "left" }}>
                <th style={th}>Matière</th>
                <th style={th}>Évaluations</th>
                <th style={{ ...th, textAlign: "right" }}>Moyenne</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((s) => (
                <tr key={s.name} style={{ borderBottom: "1px solid #ECE3D2" }}>
                  <td style={td}>
                    <strong>{s.name}</strong>
                  </td>
                  <td style={td}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {s.items.map((it: any, i: number) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "#4a3f35" }}>
                          <span>{it.kind} (coef. {it.coefficient})</span>
                          <span style={{ fontWeight: 600 }}>
                            {it.score}/{it.max_score}
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td style={{ ...td, textAlign: "right" }}>
                    <span
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        fontFamily: "var(--font-display)",
                        color: s.avg >= 14 ? "#1D6650" : s.avg >= 10 ? "#C28728" : "#C03A2B",
                      }}
                    >
                      {s.avg.toFixed(1)}
                    </span>
                    <span style={{ fontSize: 10, color: "#8a7c6e" }}>/20</span>
                  </td>
                </tr>
              ))}
              {subjects.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ ...td, textAlign: "center", color: "#8a7c6e" }}>
                    Pas encore de notes saisies.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Appréciation */}
        <div style={{ marginBottom: 20, padding: 16, background: "#F4EFE3", borderRadius: 8 }}>
          <div style={{ fontSize: 11, color: "#8a7c6e", letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>
            Appréciation de la direction
          </div>
          <div style={{ fontSize: 12.5, color: "#4a3f35", lineHeight: 1.5, minHeight: 60 }}>
            {overallAvg >= 14
              ? `${student.fullName.split(" ")[0]} fait preuve d'un travail sérieux et régulier. Continuer dans cette voie.`
              : overallAvg >= 10
              ? `Trimestre satisfaisant. Encourager les efforts dans les matières les plus faibles.`
              : `Trimestre en demi-teinte. Un soutien à la maison est recommandé.`}
          </div>
        </div>

        {/* Signatures */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30, marginTop: 30, paddingTop: 20, borderTop: "1px solid #ECE3D2" }}>
          <div>
            <div style={{ fontSize: 11, color: "#8a7c6e", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
              Direction
            </div>
            {school?.signatureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={school.signatureUrl} alt="Signature" style={{ height: 48, objectFit: "contain", display: "block", marginBottom: 4 }} />
            ) : (
              <div style={{ height: 30 }} />
            )}
            <div style={{ borderBottom: "1px solid #1a1410", paddingBottom: 4, fontSize: 11.5, color: "#1a1410", fontWeight: 600 }}>
              {school?.directorName || "Signature"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#8a7c6e", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 30 }}>
              Parent / Tuteur
            </div>
            <div style={{ borderBottom: "1px solid #1a1410", paddingBottom: 4, fontSize: 11, color: "#8a7c6e" }}>Signature</div>
          </div>
        </div>

        <div style={{ marginTop: 30, fontSize: 10, color: "#b5a99a", textAlign: "center" }}>
          Bulletin généré via E-KLASS · {new Date().toLocaleDateString("fr-FR")}
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body { background: white !important; }
              .report-toolbar { display: none !important; }
              .report-paper { border: none !important; padding: 0 !important; }
              nav, aside, header, .ek-app > div:first-child { display: none !important; }
              .ek-app { display: block !important; }
            }
          `,
        }}
      />
    </div>
  );
}

const th: React.CSSProperties = {
  padding: "8px 10px",
  fontSize: 11,
  fontWeight: 700,
  color: "#8a7c6e",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};
const td: React.CSSProperties = {
  padding: "10px 10px",
  verticalAlign: "top",
};
