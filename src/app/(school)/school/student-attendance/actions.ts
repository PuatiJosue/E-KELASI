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

async function caller(): Promise<{ userId: string; schoolId: string } | null> {
  const session = createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return null;
  const { data: staff } = await session
    .from("school_staff")
    .select("school_id")
    .eq("user_id", user.id)
    .eq("role", "school_admin")
    .maybeSingle();
  if (!staff?.school_id) return null;
  return { userId: user.id, schoolId: staff.school_id };
}

const VALID = ["present", "absent", "late", "justified"];

export async function setStudentAttendance(studentId: string, date: string, status: string): Promise<Result> {
  if (!studentId || !date || !VALID.includes(status)) return { ok: false, message: "Données invalides." };
  if (!isLiveMode()) return { ok: true };
  const c = await caller();
  if (!c) return { ok: false, message: "Action réservée à la direction." };

  const svc = service();
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
