// Couche données — présences/absences du personnel (Lot D3). Service role, scope école.

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

export type StaffLite = { id: string; name: string; category: string };
export type DayAttendance = Record<string, { status: string; comment: string | null }>;
export type AttReportRow = {
  staffId: string;
  name: string;
  present: number;
  absent: number;
  late: number;
  justified: number;
  recorded: number;
  rate: number | null; // % de présence (present / recorded)
};

export async function listActiveStaff(): Promise<StaffLite[]> {
  if (!isLiveMode()) return [];
  try {
    const school = await getMySchool();
    if (!school) return [];
    const svc = service();
    const { data } = await svc
      .from("staff_members")
      .select("id, full_name, category")
      .eq("school_id", school.id)
      .eq("status", "active")
      .order("full_name");
    return (data ?? []).map((s: any) => ({ id: s.id, name: s.full_name, category: s.category }));
  } catch {
    return [];
  }
}

export async function getAttendanceForDate(date: string): Promise<DayAttendance> {
  if (!isLiveMode()) return {};
  try {
    const school = await getMySchool();
    if (!school) return {};
    const svc = service();
    const { data } = await svc
      .from("staff_attendance")
      .select("staff_id, status, comment")
      .eq("school_id", school.id)
      .eq("date", date);
    const map: DayAttendance = {};
    for (const r of data ?? []) map[(r as any).staff_id] = { status: (r as any).status, comment: (r as any).comment };
    return map;
  } catch {
    return {};
  }
}

// ── Présence des élèves (console école) ─────────────────────────────
export type StudentLite = { id: string; name: string; className: string };
export type StudentDayAttendance = Record<string, string>; // studentId -> status

// Tous les élèves actifs de l'école (groupés côté UI par classe).
export async function listStudentsForAttendance(): Promise<StudentLite[]> {
  if (!isLiveMode()) return [];
  try {
    const school = await getMySchool();
    if (!school) return [];
    const svc = service();
    const { data } = await svc
      .from("students")
      .select("id, full_name, class_name")
      .eq("school_id", school.id)
      .eq("status", "active")
      .order("class_name")
      .order("full_name");
    return (data ?? []).map((s: any) => ({
      id: s.id,
      name: s.full_name,
      className: s.class_name ?? "—",
    }));
  } catch {
    return [];
  }
}

// Statuts de présence des élèves de l'école pour une date donnée.
export async function getStudentAttendanceForDate(date: string): Promise<StudentDayAttendance> {
  if (!isLiveMode()) return {};
  try {
    const school = await getMySchool();
    if (!school) return {};
    const svc = service();
    const { data } = await svc
      .from("student_attendance")
      .select("student_id, status")
      .eq("school_id", school.id)
      .eq("date", date);
    const map: StudentDayAttendance = {};
    for (const r of data ?? []) map[(r as any).student_id] = (r as any).status;
    return map;
  } catch {
    return {};
  }
}

export async function getAttendanceReport(from: string, to: string): Promise<AttReportRow[]> {
  if (!isLiveMode()) return [];
  try {
    const school = await getMySchool();
    if (!school) return [];
    const svc = service();
    const [staff, { data: rows }] = await Promise.all([
      listActiveStaff(),
      svc
        .from("staff_attendance")
        .select("staff_id, status")
        .eq("school_id", school.id)
        .gte("date", from)
        .lte("date", to),
    ]);
    const agg = new Map<string, { present: number; absent: number; late: number; justified: number }>();
    for (const r of rows ?? []) {
      const sid = (r as any).staff_id;
      if (!agg.has(sid)) agg.set(sid, { present: 0, absent: 0, late: 0, justified: 0 });
      const e = agg.get(sid)!;
      const st = (r as any).status;
      if (st === "present") e.present++;
      else if (st === "absent") e.absent++;
      else if (st === "late") e.late++;
      else if (st === "justified") e.justified++;
    }
    return staff.map((s) => {
      const e = agg.get(s.id) ?? { present: 0, absent: 0, late: 0, justified: 0 };
      const recorded = e.present + e.absent + e.late + e.justified;
      return {
        staffId: s.id,
        name: s.name,
        present: e.present,
        absent: e.absent,
        late: e.late,
        justified: e.justified,
        recorded,
        rate: recorded > 0 ? Math.round((e.present / recorded) * 100) : null,
      };
    });
  } catch {
    return [];
  }
}
