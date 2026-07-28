// Annuaires : enseignants, élèves et parents de l'école.

import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/env";
import { getMySchool } from "./profile";

export type SchoolTeacherRow = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  joinedAt: string;
};

export type SchoolStudentRow = {
  id: string;
  fullName: string;
  className: string;
  gradeLevel: string;
  parentNames: string[];
  avg: number | null;
  avatarUrl: string | null;
  sex: string | null;
  birthDate: string | null;
  option: string | null;
};

export type SchoolParentRow = {
  parentId: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  students: string[];
  status: "active" | "blocked";
};

export async function listSchoolTeachers(): Promise<SchoolTeacherRow[]> {
  if (!isLiveMode()) return [];
  try {
    const supabase = createClient();
    const school = await getMySchool();
    if (!school) return [];
    const { data } = await supabase
      .from("school_staff")
      .select("created_at, role, profiles(id, full_name, email)")
      .eq("school_id", school.id)
      .order("created_at");
    return (data ?? []).map((r: any) => ({
      id: r.profiles?.id ?? "",
      fullName: r.profiles?.full_name ?? "?",
      email: r.profiles?.email ?? "",
      role: r.role,
      joinedAt: new Date(r.created_at).toLocaleDateString("fr-FR", { month: "short", year: "numeric" }),
    }));
  } catch {
    return [];
  }
}

export async function listSchoolStudents(): Promise<SchoolStudentRow[]> {
  if (!isLiveMode()) return [];
  try {
    const supabase = createClient();
    const school = await getMySchool();
    if (!school) return [];
    const { data: students } = await supabase
      .from("students")
      .select("id, full_name, class_name, grade_level, avatar_url, sex, birth_date, option")
      .eq("school_id", school.id)
      .eq("status", "active")
      .order("class_name")
      .order("full_name");
    if (!students || students.length === 0) return [];

    const ids = students.map((s: any) => s.id);
    const [{ data: links }, { data: grades }] = await Promise.all([
      supabase
        .from("parent_links")
        .select("student_id, profiles!parent_links_parent_id_fkey(full_name)")
        .in("student_id", ids),
      supabase
        .from("grades")
        .select("student_id, score, max_score, coefficient")
        .in("student_id", ids)
        .is("archived_at", null),
    ]);

    return students.map((s: any) => {
      const ps = (links ?? [])
        .filter((l: any) => l.student_id === s.id)
        .map((l: any) => l.profiles?.full_name ?? "")
        .filter(Boolean);
      const gs = (grades ?? []).filter((g: any) => g.student_id === s.id);
      let avg: number | null = null;
      if (gs.length > 0) {
        const w = gs.reduce((a: number, g: any) => a + (g.score / g.max_score) * 20 * g.coefficient, 0);
        const c = gs.reduce((a: number, g: any) => a + g.coefficient, 0);
        avg = c > 0 ? +(w / c).toFixed(1) : null;
      }
      return {
        id: s.id,
        fullName: s.full_name,
        className: s.class_name ?? "—",
        gradeLevel: s.grade_level,
        parentNames: ps,
        avg,
        avatarUrl: s.avatar_url ?? null,
        sex: s.sex ?? null,
        birthDate: s.birth_date ?? null,
        option: s.option ?? null,
      };
    });
  } catch {
    return [];
  }
}

export async function listSchoolParents(): Promise<SchoolParentRow[]> {
  if (!isLiveMode()) return [];
  try {
    const supabase = createClient();
    const school = await getMySchool();
    if (!school) return [];
    const { data: students } = await supabase
      .from("students")
      .select("id, full_name")
      .eq("school_id", school.id)
      .eq("status", "active");
    const ids = (students ?? []).map((s: any) => s.id);
    if (ids.length === 0) return [];
    const studentName = new Map((students ?? []).map((s: any) => [s.id, s.full_name]));

    const { data: links } = await supabase
      .from("parent_links")
      .select("parent_id, student_id, access_status, profiles!parent_links_parent_id_fkey(full_name, email, phone, address)")
      .in("student_id", ids);

    const byParent = new Map<string, { parentId: string; fullName: string; email: string; phone: string; address: string; students: string[]; anyActive: boolean }>();
    for (const l of links ?? []) {
      const pid = (l as any).parent_id;
      const cur = byParent.get(pid) ?? {
        parentId: pid,
        fullName: (l as any).profiles?.full_name ?? "?",
        email: (l as any).profiles?.email ?? "",
        phone: (l as any).profiles?.phone ?? "",
        address: (l as any).profiles?.address ?? "",
        students: [] as string[],
        anyActive: false,
      };
      const sn = studentName.get((l as any).student_id);
      if (sn && !cur.students.includes(sn)) cur.students.push(sn);
      if ((l as any).access_status !== "blocked") cur.anyActive = true;
      byParent.set(pid, cur);
    }

    return [...byParent.values()].map((p) => ({
      parentId: p.parentId,
      fullName: p.fullName,
      email: p.email,
      phone: p.phone,
      address: p.address,
      students: p.students,
      status: p.anyActive ? "active" : "blocked",
    }));
  } catch {
    return [];
  }
}
