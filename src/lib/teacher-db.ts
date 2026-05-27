// Server-side data layer pour la console professeur.
// Le prof connecté ne voit que les données de ses écoles (RLS).

import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/db";

export type TeacherProfile = {
  id: string;
  name: string;
  email: string;
};

export type TeacherSchool = {
  id: string;
  name: string;
  city: string;
  totalStudents: number;
};

export type ClassRow = {
  className: string;
  studentCount: number;
  subjects: string[];
};

export type StudentRow = {
  id: string;
  fullName: string;
  className: string;
  avg: number | null;
};

export type GradeRow = {
  id: string;
  studentName: string;
  subjectName: string;
  kind: string;
  score: number;
  max: number;
  coefficient: number;
  gradedAt: string;
};

export type HomeworkRow = {
  id: string;
  title: string;
  subjectName: string;
  className: string;
  dueAt: string;
  status: string;
};

export type TeacherSubject = {
  id: string;
  name: string;
  shortName: string;
  color: string;
};

export async function getTeacherProfile(): Promise<TeacherProfile | null> {
  if (!isLiveMode()) {
    return { id: "demo-teacher", name: "M. Ousmane Bâ", email: "ousmane.ba@ekelasi.demo" };
  }
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("full_name, email").eq("id", user.id).maybeSingle();
  if (!data) return null;
  return { id: user.id, name: data.full_name, email: data.email };
}

export async function getTeacherSchool(): Promise<TeacherSchool | null> {
  if (!isLiveMode()) {
    return { id: "demo", name: "Lycée Albert-Camus", city: "Dakar", totalStudents: 28 };
  }
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: staff } = await supabase
      .from("school_staff")
      .select("school_id, schools(name, city)")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();
    if (!staff) return null;
    const { count } = await supabase
      .from("students")
      .select("*", { count: "exact", head: true })
      .eq("school_id", staff.school_id);
    return {
      id: staff.school_id,
      name: (staff as any).schools?.name ?? "",
      city: (staff as any).schools?.city ?? "",
      totalStudents: count ?? 0,
    };
  } catch {
    return null;
  }
}

export async function listTeacherSubjects(): Promise<TeacherSubject[]> {
  if (!isLiveMode()) return [];
  try {
    const supabase = createClient();
    const school = await getTeacherSchool();
    if (!school) return [];
    const { data } = await supabase
      .from("subjects")
      .select("id, name, short_name, color")
      .eq("school_id", school.id);
    return (data ?? []).map((s: any) => ({
      id: s.id,
      name: s.name,
      shortName: s.short_name,
      color: s.color,
    }));
  } catch {
    return [];
  }
}

export async function listTeacherClasses(): Promise<ClassRow[]> {
  if (!isLiveMode()) return [{ className: "5ème B", studentCount: 28, subjects: ["Mathématiques"] }];
  try {
    const supabase = createClient();
    const school = await getTeacherSchool();
    if (!school) return [];
    const { data: students } = await supabase
      .from("students")
      .select("class_name")
      .eq("school_id", school.id);
    const grouped = (students ?? []).reduce<Record<string, number>>((acc, s: any) => {
      const c = s.class_name ?? "—";
      acc[c] = (acc[c] ?? 0) + 1;
      return acc;
    }, {});
    return Object.entries(grouped).map(([className, count]) => ({
      className,
      studentCount: count,
      subjects: [],
    }));
  } catch {
    return [];
  }
}

export async function listStudentsInClass(className: string): Promise<StudentRow[]> {
  if (!isLiveMode()) return [];
  try {
    const supabase = createClient();
    const school = await getTeacherSchool();
    if (!school) return [];
    const { data: students } = await supabase
      .from("students")
      .select("id, full_name, class_name")
      .eq("school_id", school.id)
      .eq("class_name", className)
      .order("full_name");
    if (!students) return [];

    // moyenne par élève
    const ids = students.map((s: any) => s.id);
    const { data: grades } = await supabase
      .from("grades")
      .select("student_id, score, max_score, coefficient")
      .in("student_id", ids);

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
      };
    });
  } catch {
    return [];
  }
}

// ── Library ─────────────────────────────────────────────────────────
export type LibraryBookRow = {
  id: string;
  title: string;
  author: string;
  description: string | null;
  coverUrl: string | null;
  subjectName: string | null;
  subjectColor: string | null;
  gradeLevel: string | null;
  addedBy: string;
  mine: boolean;
  createdAt: string;
};

export async function listSchoolLibrary(): Promise<LibraryBookRow[]> {
  if (!isLiveMode()) return [];
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from("library_books")
      .select("id, title, author, description, cover_url, grade_level, added_by, created_at, subjects(name, color), profiles(full_name)")
      .order("created_at", { ascending: false });
    return (data ?? []).map((b: any) => ({
      id: b.id,
      title: b.title,
      author: b.author,
      description: b.description,
      coverUrl: b.cover_url,
      subjectName: b.subjects?.name ?? null,
      subjectColor: b.subjects?.color ?? null,
      gradeLevel: b.grade_level,
      addedBy: b.profiles?.full_name ?? "?",
      mine: user ? b.added_by === user.id : false,
      createdAt: new Date(b.created_at).toLocaleDateString("fr-FR", { month: "short", year: "numeric" }),
    }));
  } catch {
    return [];
  }
}

export async function listTeacherRecentGrades(limit = 10): Promise<GradeRow[]> {
  if (!isLiveMode()) return [];
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from("grades")
      .select("id, kind, score, max_score, coefficient, graded_at, students(full_name), subjects(name)")
      .eq("teacher_id", user.id)
      .order("graded_at", { ascending: false })
      .limit(limit);
    return (data ?? []).map((g: any) => ({
      id: g.id,
      studentName: g.students?.full_name ?? "?",
      subjectName: g.subjects?.name ?? "?",
      kind: g.kind,
      score: g.score,
      max: g.max_score,
      coefficient: g.coefficient,
      gradedAt: new Date(g.graded_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
    }));
  } catch {
    return [];
  }
}

export async function listTeacherHomework(): Promise<HomeworkRow[]> {
  if (!isLiveMode()) return [];
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from("homework")
      .select("id, title, class_name, due_at, status, subjects(name)")
      .eq("teacher_id", user.id)
      .order("due_at", { ascending: false });
    return (data ?? []).map((h: any) => ({
      id: h.id,
      title: h.title,
      subjectName: h.subjects?.name ?? "?",
      className: h.class_name,
      dueAt: new Date(h.due_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
      status: h.status,
    }));
  } catch {
    return [];
  }
}
