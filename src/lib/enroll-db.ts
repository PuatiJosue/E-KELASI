// Couche données — réinscriptions (Lot E1). Service role, scope école.

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

export type Reenrollment = {
  id: string;
  studentId: string;
  studentName: string;
  currentClass: string | null;
  schoolYear: string;
  mode: string;
  requestedClass: string | null;
  option: string | null;
  studentData: any;
  parentData: any;
  extra: any;
  status: string;
  comment: string | null;
  verifyCode: string | null;
  signedBy: string | null;
  createdAt: string;
};

export async function listReenrollments(status?: string): Promise<Reenrollment[]> {
  if (!isLiveMode()) return [];
  try {
    const school = await getMySchool();
    if (!school) return [];
    const svc = service();
    let q = svc
      .from("reenrollments")
      .select("id, student_id, school_year, mode, requested_class, option, student_data, parent_data, extra, status, comment, verify_code, signed_by, created_at, students(full_name, class_name)")
      .eq("school_id", school.id)
      .order("created_at", { ascending: false });
    if (status) q = q.eq("status", status);
    const { data } = await q;
    return (data ?? []).map((r: any) => ({
      id: r.id,
      studentId: r.student_id,
      studentName: r.students?.full_name ?? "—",
      currentClass: r.students?.class_name ?? null,
      schoolYear: r.school_year,
      mode: r.mode,
      requestedClass: r.requested_class,
      option: r.option,
      studentData: r.student_data ?? {},
      parentData: r.parent_data ?? {},
      extra: r.extra ?? [],
      status: r.status,
      comment: r.comment,
      verifyCode: r.verify_code,
      signedBy: r.signed_by,
      createdAt: r.created_at,
    }));
  } catch {
    return [];
  }
}

// Confirmation publique de réinscription par code (page imprimable).
export async function getReenrollmentByCode(code: string) {
  if (!isLiveMode()) return null;
  try {
    const svc = service();
    const { data } = await svc
      .from("reenrollments")
      .select(
        "id, student_id, school_year, mode, requested_class, option, student_data, parent_data, extra, status, comment, verify_code, signed_by, created_at, students(full_name, class_name), schools(name, city, commune, logo_url, signature_url)"
      )
      .eq("verify_code", code)
      .eq("status", "validated")
      .maybeSingle();
    if (!data) return null;
    const r: any = data;
    return {
      id: r.id,
      studentName: r.students?.full_name ?? "—",
      currentClass: r.students?.class_name ?? null,
      schoolYear: r.school_year as string | null,
      mode: r.mode as string | null,
      requestedClass: r.requested_class as string | null,
      option: r.option as string | null,
      studentData: r.student_data ?? {},
      parentData: r.parent_data ?? {},
      extra: r.extra ?? [],
      signedBy: r.signed_by as string | null,
      signatureUrl: r.schools?.signature_url ?? null,
      verifyCode: r.verify_code as string | null,
      createdAt: r.created_at as string,
      schoolName: r.schools?.name ?? "—",
      schoolCity: r.schools?.city ?? "",
      schoolCommune: r.schools?.commune ?? "",
      schoolLogoUrl: r.schools?.logo_url ?? null,
    };
  } catch {
    return null;
  }
}

export async function countPendingReenrollments(): Promise<number> {
  if (!isLiveMode()) return 0;
  try {
    const school = await getMySchool();
    if (!school) return 0;
    const svc = service();
    const { count } = await svc
      .from("reenrollments")
      .select("*", { count: "exact", head: true })
      .eq("school_id", school.id)
      .eq("status", "pending");
    return count ?? 0;
  } catch {
    return 0;
  }
}
