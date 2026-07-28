import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { SchoolLetterhead } from "@/components/school/SchoolLetterhead";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import { getStudentReportData } from "@/lib/school/dossier";
import { getMySchool } from "@/lib/school/profile";
import { getBulletinDraft } from "@/lib/bulletin-actions";
import { TRIMESTERS, currentTrimester, schoolYearLabel } from "@/lib/trimester";
import { PrintButton } from "@/components/school/PrintButton";
import { PublishButton } from "./PublishButton";
import { BulletinTable } from "@/components/school/BulletinTable";

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

  const { student, subjects } = data;
  const period = `${data.trimester.fr} · ${schoolYearLabel()}`;

  // Bulletin encodé/enregistré (par le prof ou l'école) pour ce trimestre.
  const draft = await getBulletinDraft(params.student, selectedTri);

  // Pré-remplit : l'encodage enregistré s'il existe, sinon dérivé des cotes
  // (Max = Σ des barèmes, Obtenu = Σ des points). Éditable + « Enregistrer ».
  const computedRows = subjects.map((s: any) => {
    const max = s.items.reduce((a: number, it: any) => a + Number(it.max_score || 0), 0);
    const obtenu = s.items.reduce((a: number, it: any) => a + Number(it.score || 0), 0);
    return { branche: s.name, max: String(max), obtenu: String(obtenu) };
  });
  const initialRows = draft && draft.rows.length > 0 ? draft.rows : computedRows;

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
        </div>

        {/* Bulletin éditable : Branche · Max · Obtenu + total / pourcentage / place / mention / signature */}
        <BulletinTable
          initialRows={initialRows}
          initialPlace={draft?.place ?? ""}
          initialMention={draft?.mention ?? ""}
          initialTotalObtenu={draft?.totalObtenu ?? ""}
          initialTotalMax={draft?.totalMax ?? ""}
          initialPercentage={draft?.percentage ?? ""}
          signatureUrl={school?.signatureUrl ?? null}
          directorName={school?.directorName ?? null}
          save={{ studentId: params.student, trimester: selectedTri, period }}
        />

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

