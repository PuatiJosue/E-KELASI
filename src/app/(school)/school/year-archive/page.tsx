import { serviceClient } from "@/lib/supabase/service";
import { PageHeader } from "@/components/KPI";
import { getMySchool } from "@/lib/school/profile";
import { schoolYearLabel } from "@/lib/trimester";
import { getArchiveYears } from "@/lib/year-archive-db";
import { isLiveMode } from "@/lib/env";
import { ArchivageManager } from "./ArchivageManager";

async function counts(schoolId: string): Promise<{ grades: number; homework: number }> {
  const svc = serviceClient();
  const [{ data: students }, { data: subjects }] = await Promise.all([
    svc.from("students").select("id").eq("school_id", schoolId),
    svc.from("subjects").select("id").eq("school_id", schoolId),
  ]);
  const studentIds = (students ?? []).map((s: any) => s.id);
  const subjectIds = (subjects ?? []).map((s: any) => s.id);

  const [g, h] = await Promise.all([
    studentIds.length
      ? svc.from("grades").select("id", { count: "exact", head: true }).is("archived_at", null).in("student_id", studentIds)
      : Promise.resolve({ count: 0 }),
    subjectIds.length
      ? svc.from("homework").select("id", { count: "exact", head: true }).is("archived_at", null).in("subject_id", subjectIds)
      : Promise.resolve({ count: 0 }),
  ]);
  return { grades: (g as any).count ?? 0, homework: (h as any).count ?? 0 };
}

export default async function SchoolYearArchive() {
  const school = await getMySchool();
  const [c, years] = await Promise.all([
    school && isLiveMode() ? counts(school.id) : Promise.resolve({ grades: 0, homework: 0 }),
    getArchiveYears(),
  ]);
  const defaultYear = (school as any)?.currentYear || schoolYearLabel();

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, maxWidth: 900 }}>
      <PageHeader
        title={{ fr: "Archivage", en: "Archiving" }}
        sub={{
          fr: "Archivez l'année écoulée (dossiers par classe) puis démarrez la nouvelle année.",
          en: "Archive the past year (dossiers by class) then start the new one.",
        }}
      />
      <ArchivageManager activeGrades={c.grades} activeHomework={c.homework} defaultYear={defaultYear} years={years} />
    </div>
  );
}
