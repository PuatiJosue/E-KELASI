// Classes du professeur et élèves qui les composent.

import { createClient } from "@/lib/supabase/server";
import { serviceClient } from "@/lib/supabase/service";
import { isLiveMode } from "@/lib/env";
import { trimesterOf } from "@/lib/trimester";
import { classLabel, classKey, normOption } from "@/lib/classes";
import { getTeacherSchool } from "./profile";

export type ClassRow = {
  className: string;        // class_name brut
  option: string | null;   // option/filière
  key: string;             // clé composite (value de <select>, clés React)
  label: string;           // « Niveau — Option » pour l'affichage
  studentCount: number;
  subjects: string[];
};

export type StudentRow = {
  id: string;
  fullName: string;
  className: string;
  avg: number | null;
  avatarUrl: string | null;
  sex: string | null;
};

// Classes attribuées au prof connecté, regroupées par clé composite
// (class_name + option). Source unique de vérité : un prof ne « possède » que
// les classes présentes dans course_assignments (via sa fiche staff_members).
// Renvoie aussi l'id de l'école pour éviter de la re-résoudre.
async function teacherAssignedClasses(): Promise<{
  schoolId: string;
  grouped: Map<string, { className: string; option: string | null; subjects: Set<string> }>;
} | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const school = await getTeacherSchool();
  if (!school) return null;

  const svc = serviceClient();
  // Fiche personnel du prof connecté (rattachée à son compte via linked_user_id).
  const { data: staff } = await svc
    .from("staff_members")
    .select("id")
    .eq("school_id", school.id)
    .eq("linked_user_id", user.id)
    .maybeSingle();

  const grouped = new Map<string, { className: string; option: string | null; subjects: Set<string> }>();
  if (!staff) return { schoolId: school.id, grouped };

  const { data: assigns } = await svc
    .from("course_assignments")
    .select("class_name, option, subjects(name)")
    .eq("school_id", school.id)
    .eq("staff_id", staff.id);

  // Une classe = couple (class_name, option) ; on collecte les matières enseignées.
  for (const a of (assigns ?? []) as any[]) {
    const className = a.class_name ?? "—";
    const option = normOption(a.option);
    const key = classKey(className, option);
    const cur = grouped.get(key) ?? { className, option, subjects: new Set<string>() };
    const subj = a.subjects?.name;
    if (subj) cur.subjects.add(subj);
    grouped.set(key, cur);
  }
  return { schoolId: school.id, grouped };
}

export async function listTeacherClasses(): Promise<ClassRow[]> {
  if (!isLiveMode()) return [{ className: "5ème B", option: null, key: "5ème B", label: "5ème B", studentCount: 28, subjects: ["Mathématiques"] }];
  try {
    const assigned = await teacherAssignedClasses();
    if (!assigned || assigned.grouped.size === 0) return [];

    const svc = serviceClient();
    // Effectif par classe (élèves de l'école regroupés par classe + option).
    const { data: students } = await svc
      .from("students")
      .select("class_name, option")
      .eq("school_id", assigned.schoolId)
      .eq("status", "active");
    const counts = new Map<string, number>();
    for (const s of (students ?? []) as any[]) {
      const key = classKey(s.class_name ?? "—", normOption(s.option));
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return [...assigned.grouped.entries()]
      .map(([key, g]) => ({
        className: g.className,
        option: g.option,
        key,
        label: classLabel(g.className, g.option),
        studentCount: counts.get(key) ?? 0,
        subjects: [...g.subjects],
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  } catch {
    return [];
  }
}

export async function listStudentsInClass(className: string, option?: string | null, trimester?: number): Promise<StudentRow[]> {
  if (!isLiveMode()) return [];
  try {
    const supabase = createClient();
    const assigned = await teacherAssignedClasses();
    if (!assigned) return [];

    // Sécurité : le prof ne peut consulter que les classes qui lui sont attribuées
    // (empêche l'accès direct par URL à une classe d'un autre prof).
    const wantOption = normOption(option);
    const wantKey = classKey(className, wantOption);
    if (!assigned.grouped.has(wantKey)) return [];

    const { data: studentsRaw } = await supabase
      .from("students")
      .select("id, full_name, class_name, option, avatar_url, sex")
      .eq("school_id", assigned.schoolId)
      .eq("class_name", className)
      .eq("status", "active")
      .order("full_name");
    if (!studentsRaw) return [];

    // Filtre par option côté JS : robuste si un niveau mêle élèves avec/sans option.
    const students = studentsRaw.filter((s: any) => normOption(s.option) === wantOption);
    if (students.length === 0) return [];

    // moyenne par élève (filtrée sur le trimestre si demandé)
    const ids = students.map((s: any) => s.id);
    const { data: gradesRaw } = await supabase
      .from("grades")
      .select("student_id, score, max_score, coefficient, graded_at")
      .in("student_id", ids)
      .is("archived_at", null);
    const grades = trimester
      ? (gradesRaw ?? []).filter((g: any) => trimesterOf(g.graded_at) === trimester)
      : (gradesRaw ?? []);

    return students.map((s: any) => {
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
        className: s.class_name,
        avg,
        avatarUrl: s.avatar_url ?? null,
        sex: s.sex ?? null,
      };
    });
  } catch {
    return [];
  }
}
