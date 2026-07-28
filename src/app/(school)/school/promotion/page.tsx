import { PageHeader } from "@/components/KPI";
import { getMySchool } from "@/lib/school/profile";
import { listSchoolStudents } from "@/lib/school/people";
import { PromotionManager } from "@/components/school/PromotionManager";
import { getLastPromotionInfo } from "@/app/(school)/school/promotion/actions";
import { schoolYearLabel } from "@/lib/trimester";

/** « 2025-2026 » / « 2025 – 2026 » → « 2026-2027 ». */
function nextYearLabel(cur: string): string {
  const y = parseInt((cur.match(/(\d{4})/)?.[1] ?? ""), 10);
  if (!y || isNaN(y)) {
    const m = parseInt((schoolYearLabel().match(/(\d{4})/)?.[1] ?? ""), 10) || new Date().getFullYear();
    return `${m + 1}-${m + 2}`;
  }
  return `${y + 1}-${y + 2}`;
}

export default async function PromotionPage() {
  const [school, students, lastBatch] = await Promise.all([
    getMySchool(),
    listSchoolStudents(),
    getLastPromotionInfo(),
  ]);
  const targetYear = nextYearLabel(school?.currentYear || schoolYearLabel());

  return (
    <div className="ek-hero" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
      <PageHeader
        eyebrow={{ fr: "Réinscription", en: "Re-enrollment" }}
        title={{ fr: "Passage de classe", en: "Class promotion" }}
        sub={{
          fr: "Faites passer vos élèves en classe supérieure pour la nouvelle année. Chaque passage génère un certificat de réinscription signé.",
          en: "Promote your students to the next grade for the new year. Each promotion generates a signed re-enrollment certificate.",
        }}
      />
      <PromotionManager
        students={students.map((s) => ({ id: s.id, name: s.fullName, className: s.className, option: s.option, sex: s.sex }))}
        defaultYear={targetYear}
        schoolName={school?.name ?? ""}
        lastBatch={lastBatch}
      />
    </div>
  );
}
