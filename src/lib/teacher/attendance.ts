// Présence des élèves relevée par le professeur.

import { serviceClient } from "@/lib/supabase/service";
import { isLiveMode } from "@/lib/env";

// ── Présence des élèves ─────────────────────────────────────────────
export type StudentAttendanceMap = Record<string, string>; // studentId -> status

export async function getStudentAttendanceForDate(
  studentIds: string[],
  date: string
): Promise<StudentAttendanceMap> {
  if (!isLiveMode() || studentIds.length === 0) return {};
  try {
    const svc = serviceClient();
    const { data } = await svc
      .from("student_attendance")
      .select("student_id, status")
      .eq("date", date)
      .in("student_id", studentIds);
    const map: StudentAttendanceMap = {};
    for (const r of data ?? []) map[(r as any).student_id] = (r as any).status;
    return map;
  } catch {
    return {};
  }
}
