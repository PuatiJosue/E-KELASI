// Couche données — attribution des cours (Lot D2). Service role, scope école.

import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getMySchool } from "@/lib/school-db";
import { isLiveMode } from "@/lib/db";

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export type Assignment = {
  id: string;
  staffId: string;
  staffName: string;
  subjectId: string;
  subjectName: string;
  className: string;
  weeklyHours: number;
};

export type FormOptions = {
  teachers: { id: string; name: string; category: string }[];
  subjects: { id: string; name: string }[];
  classes: string[];
};

export async function listAssignments(): Promise<Assignment[]> {
  if (!isLiveMode()) return [];
  try {
    const school = await getMySchool();
    if (!school) return [];
    const svc = service();
    const { data } = await svc
      .from("course_assignments")
      .select("id, staff_id, subject_id, class_name, weekly_hours, staff_members(full_name), subjects(name)")
      .eq("school_id", school.id)
      .order("class_name");
    return (data ?? []).map((a: any) => ({
      id: a.id,
      staffId: a.staff_id,
      staffName: a.staff_members?.full_name ?? "—",
      subjectId: a.subject_id,
      subjectName: a.subjects?.name ?? "—",
      className: a.class_name,
      weeklyHours: Number(a.weekly_hours),
    }));
  } catch {
    return [];
  }
}

export async function listFormOptions(): Promise<FormOptions> {
  if (!isLiveMode()) return { teachers: [], subjects: [], classes: [] };
  try {
    const school = await getMySchool();
    if (!school) return { teachers: [], subjects: [], classes: [] };
    const svc = service();
    const [{ data: staff }, { data: subjects }, { data: students }] = await Promise.all([
      svc.from("staff_members").select("id, full_name, category").eq("school_id", school.id).order("full_name"),
      svc.from("subjects").select("id, name").eq("school_id", school.id).order("name"),
      svc.from("students").select("class_name").eq("school_id", school.id),
    ]);
    const classes = [...new Set((students ?? []).map((s: any) => s.class_name).filter(Boolean))].sort();
    return {
      teachers: (staff ?? []).map((s: any) => ({ id: s.id, name: s.full_name, category: s.category })),
      subjects: (subjects ?? []).map((s: any) => ({ id: s.id, name: s.name })),
      classes,
    };
  } catch {
    return { teachers: [], subjects: [], classes: [] };
  }
}
