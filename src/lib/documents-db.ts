// Couche données — documents officiels (Lot E2). Service role.

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

export type StudentDocument = {
  id: string;
  type: string;
  title: string;
  period: string | null;
  signedBy: string | null;
  signatureUrl: string | null;
  verifyCode: string;
  issuedAt: string;
};

// Documents publiés d'un élève (vue école).
export async function listStudentDocuments(studentId: string): Promise<StudentDocument[]> {
  if (!isLiveMode()) return [];
  try {
    const school = await getMySchool();
    if (!school) return [];
    const svc = service();
    const { data } = await svc
      .from("student_documents")
      .select("id, type, title, period, signed_by, signature_url, verify_code, issued_at")
      .eq("school_id", school.id)
      .eq("student_id", studentId)
      .order("issued_at", { ascending: false });
    return (data ?? []).map((d: any) => ({
      id: d.id,
      type: d.type,
      title: d.title,
      period: d.period,
      signedBy: d.signed_by,
      signatureUrl: d.signature_url,
      verifyCode: d.verify_code,
      issuedAt: d.issued_at,
    }));
  } catch {
    return [];
  }
}

// Vérification publique d'un document par son code.
export async function getDocumentByCode(code: string) {
  if (!isLiveMode()) return null;
  try {
    const svc = service();
    const { data } = await svc
      .from("student_documents")
      .select("title, period, signed_by, issued_at, data, students(full_name), schools(name, city)")
      .eq("verify_code", code)
      .maybeSingle();
    if (!data) return null;
    return {
      title: (data as any).title,
      period: (data as any).period,
      signedBy: (data as any).signed_by,
      issuedAt: (data as any).issued_at,
      studentName: (data as any).students?.full_name ?? "—",
      schoolName: (data as any).schools?.name ?? "—",
      schoolCity: (data as any).schools?.city ?? "",
      data: (data as any).data,
    };
  } catch {
    return null;
  }
}
