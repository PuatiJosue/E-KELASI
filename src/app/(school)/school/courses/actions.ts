"use server";

import { revalidatePath } from "next/cache";
import { serviceClient } from "@/lib/supabase/service";
import { isLiveMode } from "@/lib/env";
import { requireSchoolAdminId } from "@/lib/auth/guards";
import type { Result } from "@/lib/result";


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
  const schoolId = await requireSchoolAdminId();
  if (!schoolId) return { ok: false, message: "Action réservée à la direction." };
  const svc = serviceClient();
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
  const schoolId = await requireSchoolAdminId();
  if (!schoolId) return { ok: false, message: "Action réservée à la direction." };
  const svc = serviceClient();
  const { error } = await svc.from("course_assignments").delete().eq("id", id).eq("school_id", schoolId);
  if (error) return { ok: false, message: "Suppression impossible." };
  revalidatePath("/school/courses");
  return { ok: true };
}
