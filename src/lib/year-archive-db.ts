// Lecture des archives de fin d'année (instantané durable, table
// student_year_archives). Service role ; scope école via getMySchool.

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

export type ArchiveBulletin = {
  trimester: number;
  place: string;
  mention: string;
  totalObtenu: string;
  totalMax: string;
  percentage: string;
  rows: { branche: string; max: string; obtenu: string }[];
};

export type ArchivePayload = {
  identity: {
    fullName: string;
    matricule: string | null;
    sex: string | null;
    className: string;
    birthDate: string | null;
    birthPlace: string | null;
    fatherName: string | null;
    motherName: string | null;
    guardianName: string | null;
    guardianPhone: string | null;
    enrolledAt: string | null;
  };
  parent: { name: string; phone: string | null } | null;
  finance: { currency: string; totalDue: number; paid: number; remaining: number };
  bulletins: ArchiveBulletin[];
  attendance: { present: number; absent: number; late: number; justified: number; recorded: number; rate: number | null };
  decision: "promotion" | "redoublant" | "graduated" | null;
};

export type ArchiveClass = { name: string; count: number };
export type ArchiveStudentLite = { id: string; fullName: string; className: string; decision: string | null };
export type StudentArchive = { id: string; fullName: string; className: string; schoolYear: string; payload: ArchivePayload };

export async function getArchiveYears(): Promise<string[]> {
  if (!isLiveMode()) return [];
  try {
    const school = await getMySchool();
    if (!school) return [];
    const svc = service();
    const { data } = await svc.from("student_year_archives").select("school_year").eq("school_id", school.id);
    return [...new Set((data ?? []).map((r: any) => r.school_year))].sort().reverse();
  } catch { return []; }
}

export async function getArchiveClasses(year: string): Promise<ArchiveClass[]> {
  if (!isLiveMode()) return [];
  try {
    const school = await getMySchool();
    if (!school) return [];
    const svc = service();
    const { data } = await svc.from("student_year_archives").select("class_name").eq("school_id", school.id).eq("school_year", year);
    const counts = new Map<string, number>();
    for (const r of (data ?? []) as any[]) { const n = r.class_name ?? "—"; counts.set(n, (counts.get(n) ?? 0) + 1); }
    return [...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name, "fr", { numeric: true }));
  } catch { return []; }
}

export async function getArchiveStudents(year: string, className: string): Promise<ArchiveStudentLite[]> {
  if (!isLiveMode()) return [];
  try {
    const school = await getMySchool();
    if (!school) return [];
    const svc = service();
    const { data } = await svc
      .from("student_year_archives")
      .select("id, full_name, class_name, payload")
      .eq("school_id", school.id).eq("school_year", year).eq("class_name", className)
      .order("full_name");
    return (data ?? []).map((r: any) => ({ id: r.id, fullName: r.full_name ?? "—", className: r.class_name ?? "—", decision: r.payload?.decision ?? null }));
  } catch { return []; }
}

export async function getStudentArchive(id: string): Promise<StudentArchive | null> {
  if (!isLiveMode()) return null;
  try {
    const school = await getMySchool();
    if (!school) return null;
    const svc = service();
    const { data } = await svc
      .from("student_year_archives")
      .select("id, full_name, class_name, school_year, payload")
      .eq("school_id", school.id).eq("id", id).maybeSingle();
    if (!data) return null;
    const r: any = data;
    return { id: r.id, fullName: r.full_name ?? "—", className: r.class_name ?? "—", schoolYear: r.school_year, payload: r.payload };
  } catch { return null; }
}
