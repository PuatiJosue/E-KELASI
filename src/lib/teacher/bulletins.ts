// Bulletin d'un élève, côté encodage professeur.

import { createClient } from "@/lib/supabase/server";
import { serviceClient } from "@/lib/supabase/service";
import { isLiveMode } from "@/lib/env";
import { trimesterOf } from "@/lib/trimester";
import { classLabel } from "@/lib/classes";

// ── Bulletin (encodage côté professeur) ─────────────────────────────
export type TeacherBulletinData = {
  student: { fullName: string; className: string };
  school: { name: string; city: string; logoUrl: string | null; signatureUrl: string | null; directorName: string | null };
  rows: { branche: string; max: string; obtenu: string }[];
};

// Données pour encoder le bulletin d'un élève (école du prof + cotes du trimestre).
export async function getTeacherStudentBulletin(studentId: string, trimester: number): Promise<TeacherBulletinData | null> {
  if (!isLiveMode()) return null;
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: staff } = await supabase
      .from("school_staff")
      .select("school_id")
      .eq("user_id", user.id)
      .in("role", ["teacher", "school_admin"])
      .limit(1)
      .maybeSingle();
    const schoolId = (staff as any)?.school_id;
    if (!schoolId) return null;

    const svc = serviceClient();
    const { data: student } = await svc
      .from("students")
      .select("full_name, class_name, option, school_id, schools(name, city, logo_url, signature_url, director_name)")
      .eq("id", studentId)
      .maybeSingle();
    if (!student || (student as any).school_id !== schoolId) return null;
    const s: any = student;

    const { data: grades } = await svc
      .from("grades")
      .select("score, max_score, graded_at, subjects(name)")
      .eq("student_id", studentId)
      .is("archived_at", null);
    const gradesT = (grades ?? []).filter((g: any) => trimesterOf(g.graded_at) === trimester);

    // Agrège par branche : Max = Σ barèmes, Obtenu = Σ points.
    const byBranch = new Map<string, { max: number; obtenu: number }>();
    for (const g of gradesT as any[]) {
      const name = g.subjects?.name ?? "—";
      if (!byBranch.has(name)) byBranch.set(name, { max: 0, obtenu: 0 });
      const e = byBranch.get(name)!;
      e.max += Number(g.max_score || 0);
      e.obtenu += Number(g.score || 0);
    }
    const rows = [...byBranch.entries()].map(([branche, v]) => ({
      branche,
      max: String(v.max),
      obtenu: String(v.obtenu),
    }));

    return {
      student: { fullName: s.full_name, className: classLabel(s.class_name, s.option) },
      school: {
        name: s.schools?.name ?? "École",
        city: s.schools?.city ?? "",
        logoUrl: s.schools?.logo_url ?? null,
        signatureUrl: s.schools?.signature_url ?? null,
        directorName: s.schools?.director_name ?? null,
      },
      rows,
    };
  } catch {
    return null;
  }
}
