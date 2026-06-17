// Couche données — inscriptions (nouvel élève). Service role, scope école.

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

export type Inscription = {
  id: string;
  studentData: any;
  parentData: any;
  extra: any;
  photoStudentUrl: string | null;
  photoParentUrl: string | null;
  documentsUrl: string | null;
  schoolYear: string | null;
  requestedClass: string | null;
  option: string | null;
  status: string;
  comment: string | null;
  signedBy: string | null;
  signatureUrl: string | null;
  verifyCode: string | null;
  createdAt: string;
};

function map(r: any): Inscription {
  return {
    id: r.id,
    studentData: r.student_data ?? {},
    parentData: r.parent_data ?? {},
    extra: r.extra ?? [],
    photoStudentUrl: r.photo_student_url,
    photoParentUrl: r.photo_parent_url,
    documentsUrl: r.documents_url,
    schoolYear: r.school_year,
    requestedClass: r.requested_class,
    option: r.option,
    status: r.status,
    comment: r.comment,
    signedBy: r.signed_by,
    signatureUrl: r.signature_url,
    verifyCode: r.verify_code,
    createdAt: r.created_at,
  };
}

const COLS = "id, student_data, parent_data, extra, photo_student_url, photo_parent_url, documents_url, school_year, requested_class, option, status, comment, signed_by, signature_url, verify_code, created_at";

export async function listInscriptions(status?: string): Promise<Inscription[]> {
  if (!isLiveMode()) return [];
  try {
    const school = await getMySchool();
    if (!school) return [];
    const svc = service();
    let q = svc.from("inscriptions").select(COLS).eq("school_id", school.id).order("created_at", { ascending: false });
    if (status) q = q.eq("status", status);
    const { data } = await q;
    return (data ?? []).map(map);
  } catch {
    return [];
  }
}

// Confirmation publique d'inscription par code (page imprimable).
export async function getInscriptionByCode(code: string) {
  if (!isLiveMode()) return null;
  try {
    const svc = service();
    const { data } = await svc
      .from("inscriptions")
      .select(COLS + ", schools(name, city, commune)")
      .eq("verify_code", code)
      .eq("status", "validated")
      .maybeSingle();
    if (!data) return null;
    return {
      ...map(data),
      schoolName: (data as any).schools?.name ?? "—",
      schoolCity: (data as any).schools?.city ?? "",
      schoolCommune: (data as any).schools?.commune ?? "",
    };
  } catch {
    return null;
  }
}
