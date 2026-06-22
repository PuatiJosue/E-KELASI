import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import { SchoolLetterhead } from "@/components/school/SchoolLetterhead";
import { BulletinTable } from "@/components/school/BulletinTable";
import { getTeacherStudentBulletin } from "@/lib/teacher-db";
import { getBulletinDraft } from "@/lib/bulletin-actions";
import { TRIMESTERS, currentTrimester, trimesterMeta, schoolYearLabel } from "@/lib/trimester";

export const dynamic = "force-dynamic";

export default async function TeacherBulletin({
  params,
  searchParams,
}: {
  params: { student: string };
  searchParams: { t?: string };
}) {
  const selectedTri = Number(searchParams.t) || currentTrimester();
  const [b, draft] = await Promise.all([
    getTeacherStudentBulletin(params.student, selectedTri),
    getBulletinDraft(params.student, selectedTri),
  ]);

  if (!b) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--ink-3)" }}>
        <T fr="Élève introuvable." en="Student not found." />
      </div>
    );
  }

  const period = `${trimesterMeta(selectedTri).fr} · ${schoolYearLabel()}`;
  const initialRows = draft && draft.rows.length > 0 ? draft.rows : b.rows;

  return (
    <div style={{ padding: 24, maxWidth: 880, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
        <Link href={`/teacher/classes/${encodeURIComponent(b.student.className)}`} className="ek-btn ek-btn-outline" style={{ height: 32, fontSize: 12 }}>
          <Icon name="chevL" size={14} />
          <T fr="Retour" en="Back" />
        </Link>
        {/* Sélecteur de trimestre */}
        <div style={{ display: "flex", gap: 4, alignItems: "center", background: "var(--surface-2)", borderRadius: 9, padding: 3 }}>
          {TRIMESTERS.map((m) => {
            const on = m.index === selectedTri;
            return (
              <Link
                key={m.index}
                href={`/teacher/bulletins/${params.student}?t=${m.index}`}
                style={{ fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 7, color: on ? "var(--ink)" : "var(--ink-3)", background: on ? "var(--surface)" : "transparent" }}
              >
                {m.short}
              </Link>
            );
          })}
        </div>
      </div>

      <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginBottom: 12 }}>
        <T
          fr="Encodez le bulletin puis cliquez sur « Enregistrer ». L'envoi aux parents se fait par la direction de l'école."
          en="Encode the report then click “Save”. Sending to parents is done by the school administration."
        />
      </div>

      <div className="ek-card" style={{ background: "white", padding: 40, borderRadius: 12, color: "#1a1410" }}>
        <SchoolLetterhead
          name={b.school.name}
          subtitle={b.school.city}
          logoUrl={b.school.logoUrl}
          rightTitle="Bulletin scolaire"
          rightValue={period}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: 16, borderRadius: 10, background: "#FDF3E7", border: "1px solid #F9DDB8", marginBottom: 20 }}>
          <Avatar name={b.student.fullName} size={48} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#1a1410", fontFamily: "var(--font-display)" }}>{b.student.fullName}</div>
            <div style={{ fontSize: 12.5, color: "#4a3f35" }}>
              <T fr="Classe" en="Class" /> : <strong>{b.student.className}</strong>
            </div>
          </div>
        </div>

        <BulletinTable
          initialRows={initialRows}
          initialPlace={draft?.place ?? ""}
          initialMention={draft?.mention ?? ""}
          initialTotalObtenu={draft?.totalObtenu ?? ""}
          initialTotalMax={draft?.totalMax ?? ""}
          initialPercentage={draft?.percentage ?? ""}
          signatureUrl={b.school.signatureUrl}
          directorName={b.school.directorName}
          save={{ studentId: params.student, trimester: selectedTri, period }}
        />
      </div>
    </div>
  );
}
