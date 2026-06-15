"use server";

import { revalidatePath } from "next/cache";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/db";

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function callerSchoolId(): Promise<string | null> {
  const session = createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return null;
  const { data: staff } = await session
    .from("school_staff")
    .select("school_id")
    .eq("user_id", user.id)
    .eq("role", "school_admin")
    .maybeSingle();
  return staff?.school_id ?? null;
}

export type PendingStudent = {
  id: string;
  fullName: string;
  sex: string | null;
  birthDate: string | null;
  className: string | null;
  option: string | null;
  parentName: string;
  parentEmail: string;
  parentPhone: string | null;
  createdAt: string;
};

export async function getPendingStudents(): Promise<PendingStudent[]> {
  if (!isLiveMode()) return [];
  const schoolId = await callerSchoolId();
  if (!schoolId) return [];
  const svc = service();
  const { data: students } = await svc
    .from("students")
    .select("id, full_name, sex, birth_date, class_name, option, created_at, created_by")
    .eq("school_id", schoolId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (!students || students.length === 0) return [];

  const parentIds = [...new Set(students.map((s: any) => s.created_by).filter(Boolean))];
  const { data: parents } = parentIds.length
    ? await svc.from("profiles").select("id, full_name, email, phone").in("id", parentIds)
    : { data: [] as any[] };
  const pmap = new Map((parents ?? []).map((p: any) => [p.id, p]));

  return students.map((s: any) => {
    const p = pmap.get(s.created_by);
    return {
      id: s.id,
      fullName: s.full_name,
      sex: s.sex,
      birthDate: s.birth_date,
      className: s.class_name,
      option: s.option ?? null,
      parentName: p?.full_name ?? "—",
      parentEmail: p?.email ?? "",
      parentPhone: p?.phone ?? null,
      createdAt: new Date(s.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
    };
  });
}

export async function setStudentValidation(studentId: string, approve: boolean): Promise<{ ok: boolean; message?: string }> {
  if (!studentId) return { ok: false, message: "Élève invalide." };
  if (!isLiveMode()) return { ok: true };
  const schoolId = await callerSchoolId();
  if (!schoolId) return { ok: false, message: "Réservé à la direction." };

  const svc = service();
  const { data: st } = await svc.from("students").select("id").eq("id", studentId).eq("school_id", schoolId).maybeSingle();
  if (!st) return { ok: false, message: "Élève introuvable." };

  const { error } = await svc.from("students").update({ status: approve ? "active" : "rejected" }).eq("id", studentId);
  if (error) return { ok: false, message: "Échec de la mise à jour." };

  revalidatePath("/school/requests");
  revalidatePath("/school/students");
  return { ok: true };
}
