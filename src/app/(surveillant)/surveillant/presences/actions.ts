"use server";

// Pointage des présences par le surveillant. Même table et mêmes statuts que le
// pointage de la direction : la présence saisie ici est immédiatement visible
// dans /school/student-attendance (et inversement).

import { revalidatePath } from "next/cache";
import { serviceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/env";
import type { Result } from "@/lib/result";


async function caller(): Promise<{ userId: string; schoolId: string } | null> {
  const session = createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return null;
  const { data: staff } = await session
    .from("school_staff")
    .select("school_id")
    .eq("user_id", user.id)
    .eq("role", "surveillant")
    .maybeSingle();
  if (!staff?.school_id) return null;
  return { userId: user.id, schoolId: staff.school_id };
}

const VALID = ["present", "absent", "late", "justified"];

export async function setStudentAttendanceBySurveillant(
  studentId: string,
  date: string,
  status: string
): Promise<Result> {
  if (!studentId || !date || !VALID.includes(status)) return { ok: false, message: "Données invalides." };
  if (!isLiveMode()) return { ok: true };
  const c = await caller();
  if (!c) return { ok: false, message: "Action réservée au surveillant." };

  const svc = serviceClient();
  // L'élève doit appartenir à l'école du surveillant.
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
  revalidatePath("/surveillant/presences");
  revalidatePath("/school/student-attendance");
  return { ok: true };
}
