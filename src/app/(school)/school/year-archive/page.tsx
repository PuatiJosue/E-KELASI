import { createClient as createServiceClient } from "@supabase/supabase-js";
import { PageHeader } from "@/components/KPI";
import { getMySchool } from "@/lib/school-db";
import { isLiveMode } from "@/lib/db";
import { YearArchiveForm } from "./YearArchiveForm";

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function counts(schoolId: string): Promise<{ grades: number; homework: number }> {
  const svc = service();
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
  const c = school && isLiveMode() ? await counts(school.id) : { grades: 0, homework: 0 };

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, maxWidth: 720 }}>
      <PageHeader
        title={{ fr: "Nouvelle année scolaire", en: "New school year" }}
        sub={{
          fr: "Archivez l'année écoulée et repartez sur une base propre.",
          en: "Archive the past year and start fresh.",
        }}
      />
      <YearArchiveForm activeGrades={c.grades} activeHomework={c.homework} />
    </div>
  );
}
