"use server";

import { revalidatePath } from "next/cache";
import { serviceClient } from "@/lib/supabase/service";
import { isLiveMode } from "@/lib/env";
import { requireSchoolAdmin } from "@/lib/auth/guards";
import type { Result } from "@/lib/result";


const VALID = ["present", "absent", "late", "justified"];

export async function setStudentAttendance(studentId: string, date: string, status: string): Promise<Result> {
  if (!studentId || !date || !VALID.includes(status)) return { ok: false, message: "Données invalides." };
  if (!isLiveMode()) return { ok: true };
  const c = await requireSchoolAdmin();
  if (!c) return { ok: false, message: "Action réservée à la direction." };

  const svc = serviceClient();
  // L'élève doit appartenir à l'école de l'utilisateur.
  const { data: student } = await svc
    .from("students")
    .select("school_id")
    .eq("id", studentId)
    .maybeSingle();
  if (!student || (student as any).school_id !== c.schoolId) {
    return { ok: false, message: "Élève introuvable." };
  }

  const { error } = await svc.from("student_attendance").upsert(
    {
      school_id: c.schoolId,
      student_id: studentId,
      date,
      status,
      recorded_by: c.userId,
    },
    { onConflict: "student_id,date" }
  );
  if (error) return { ok: false, message: "Enregistrement impossible." };
  revalidatePath("/school/student-attendance");
  return { ok: true };
}
