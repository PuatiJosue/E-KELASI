"use server";

import { revalidatePath } from "next/cache";
import { serviceClient } from "@/lib/supabase/service";
import { isLiveMode } from "@/lib/env";
import { requireSchoolAdmin } from "@/lib/auth/guards";
import type { Result } from "@/lib/result";


const VALID = ["present", "absent", "late", "justified"];

// Vérifie que l'appelant dirige bien l'école de l'élève visé.
async function adminOfStudent(studentId: string) {
  const c = await requireSchoolAdmin();
  if (!c) return null;
  const { data: student } = await serviceClient()
    .from("students")
    .select("school_id")
    .eq("id", studentId)
    .maybeSingle();
  if (!student || (student as any).school_id !== c.schoolId) return null;
  return c;
}

export async function setStudentAttendance(
  studentId: string,
  date: string,
  status: string,
  comment?: string
): Promise<Result> {
  if (!studentId || !date || !VALID.includes(status)) return { ok: false, message: "Données invalides." };
  if (!isLiveMode()) return { ok: true };
  const c = await adminOfStudent(studentId);
  if (!c) return { ok: false, message: "Action réservée à la direction." };

  const { error } = await serviceClient().from("student_attendance").upsert(
    {
      school_id: c.schoolId,
      student_id: studentId,
      date,
      status,
      comment: comment?.trim() || null,
      recorded_by: c.userId,
    },
    { onConflict: "student_id,date" }
  );
  if (error) return { ok: false, message: "Enregistrement impossible." };
  revalidatePath("/school/student-attendance");
  return { ok: true };
}

// Motif de la correction (justification d'une absence, cause d'un retard…).
// Le statut du jour doit déjà exister : le motif seul n'a pas de sens.
export async function setStudentAttendanceComment(
  studentId: string,
  date: string,
  comment: string
): Promise<Result> {
  if (!studentId || !date) return { ok: false, message: "Données invalides." };
  if (!isLiveMode()) return { ok: true };
  const c = await adminOfStudent(studentId);
  if (!c) return { ok: false, message: "Action réservée à la direction." };

  const { error } = await serviceClient()
    .from("student_attendance")
    .update({ comment: comment.trim() || null, recorded_by: c.userId })
    .eq("student_id", studentId)
    .eq("date", date);
  if (error) return { ok: false, message: "Enregistrement impossible." };
  revalidatePath("/school/student-attendance");
  return { ok: true };
}

// Annule un pointage erroné : l'élève redevient « non pointé » pour ce jour.
export async function clearStudentAttendance(studentId: string, date: string): Promise<Result> {
  if (!studentId || !date) return { ok: false, message: "Données invalides." };
  if (!isLiveMode()) return { ok: true };
  const c = await adminOfStudent(studentId);
  if (!c) return { ok: false, message: "Action réservée à la direction." };

  const { error } = await serviceClient()
    .from("student_attendance")
    .delete()
    .eq("student_id", studentId)
    .eq("date", date);
  if (error) return { ok: false, message: "Suppression impossible." };
  revalidatePath("/school/student-attendance");
  return { ok: true };
}
