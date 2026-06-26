"use server";

import { revalidatePath } from "next/cache";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/db";

type Result = { ok: true } | { ok: false; message: string };

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

export async function createAssignment(input: {
  staffId: string;
  subjectId: string;
  className: string;
  option?: string;
  weeklyHours: number;
}): Promise<Result> {
  if (!input.staffId || !input.subjectId || !input.className?.trim()) {
    return { ok: false, message: "Enseignant, matière et classe requis." };
  }
  if (!isLiveMode()) return { ok: true };
  const schoolId = await callerSchoolId();
  if (!schoolId) return { ok: false, message: "Action réservée à la direction." };
  const svc = service();
  const { error } = await svc.from("course_assignments").insert({
    school_id: schoolId,
    staff_id: input.staffId,
    subject_id: input.subjectId,
    class_name: input.className.trim(),
    option: input.option?.trim() || null,
    weekly_hours: input.weeklyHours > 0 ? input.weeklyHours : 0,
  });
  if (error) {
    const dup = (error as any).code === "23505";
    return { ok: false, message: dup ? "Cette attribution existe déjà." : "Enregistrement impossible." };
  }
  revalidatePath("/school/courses");
  return { ok: true };
}

export async function deleteAssignment(id: string): Promise<Result> {
  if (!id) return { ok: false, message: "Attribution invalide." };
  if (!isLiveMode()) return { ok: true };
  const schoolId = await callerSchoolId();
  if (!schoolId) return { ok: false, message: "Action réservée à la direction." };
  const svc = service();
  const { error } = await svc.from("course_assignments").delete().eq("id", id).eq("school_id", schoolId);
  if (error) return { ok: false, message: "Suppression impossible." };
  revalidatePath("/school/courses");
  return { ok: true };
}
