// Server-side data layer pour la console professeur.
// Le prof connecté ne voit que les données de ses écoles (RLS).

import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { isLiveMode } from "@/lib/db";
import { trimesterOf, schoolYearLabel } from "@/lib/trimester";
import { formatDateFr } from "@/lib/grade-report";
import { classLabel, classKey, normOption } from "@/lib/classes";

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export type TeacherProfile = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
};

export type TeacherSchool = {
  id: string;
  name: string;
  city: string;
  totalStudents: number;
};

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
  overdue: boolean;
};

export type TeacherSubject = {
  id: string;
  name: string;
  shortName: string;
  color: string;
};

export async function getTeacherProfile(): Promise<TeacherProfile | null> {
  if (!isLiveMode()) {
    return { id: "demo-teacher", name: "M. Ousmane Bâ", email: "ousmane.ba@ekelasi.demo", avatarUrl: null };
  }
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("full_name, email, avatar_url")
    .eq("id", user.id)
    .maybeSingle();
  if (!data) return null;
  return { id: user.id, name: data.full_name, email: data.email, avatarUrl: data.avatar_url };
}

// Statut de l'école du prof (pour bloquer l'accès si l'abonnement est impayé).
export async function getTeacherSchoolStatus(): Promise<string | null> {
  if (!isLiveMode()) return "active";
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: staff } = await supabase
      .from("school_staff")
      .select("schools(status)")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();
    return (staff as any)?.schools?.status ?? null;
  } catch {
    return null;
  }
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
      .eq("school_id", staff.school_id)
      .eq("status", "active");
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

  const svc = service();
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

    const svc = service();
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

// ── Bulletin (encodage côté professeur) ─────────────────────────────
export type TeacherBulletinData = {
  student: { fullName: string; className: string };
  school: { name: string; city: string; logoUrl: string | null; signatureUrl: string | null; directorName: string | null };
  rows: { branche: string; max: string; obtenu: string }[];
};

// Données pour encoder le bulletin d'un élève (école du prof + cotes du trimestre).
export async function getTeacherStudentBulletin(studentId: string, trimester: number): Promise<TeacherBulletinData | null> {
  if (!isLiveMode()) return null;
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: staff } = await supabase
      .from("school_staff")
      .select("school_id")
      .eq("user_id", user.id)
      .in("role", ["teacher", "school_admin"])
      .limit(1)
      .maybeSingle();
    const schoolId = (staff as any)?.school_id;
    if (!schoolId) return null;

    const svc = service();
    const { data: student } = await svc
      .from("students")
      .select("full_name, class_name, option, school_id, schools(name, city, logo_url, signature_url, director_name)")
      .eq("id", studentId)
      .maybeSingle();
    if (!student || (student as any).school_id !== schoolId) return null;
    const s: any = student;

    const { data: grades } = await svc
      .from("grades")
      .select("score, max_score, graded_at, subjects(name)")
      .eq("student_id", studentId)
      .is("archived_at", null);
    const gradesT = (grades ?? []).filter((g: any) => trimesterOf(g.graded_at) === trimester);

    // Agrège par branche : Max = Σ barèmes, Obtenu = Σ points.
    const byBranch = new Map<string, { max: number; obtenu: number }>();
    for (const g of gradesT as any[]) {
      const name = g.subjects?.name ?? "—";
      if (!byBranch.has(name)) byBranch.set(name, { max: 0, obtenu: 0 });
      const e = byBranch.get(name)!;
      e.max += Number(g.max_score || 0);
      e.obtenu += Number(g.score || 0);
    }
    const rows = [...byBranch.entries()].map(([branche, v]) => ({
      branche,
      max: String(v.max),
      obtenu: String(v.obtenu),
    }));

    return {
      student: { fullName: s.full_name, className: classLabel(s.class_name, s.option) },
      school: {
        name: s.schools?.name ?? "École",
        city: s.schools?.city ?? "",
        logoUrl: s.schools?.logo_url ?? null,
        signatureUrl: s.schools?.signature_url ?? null,
        directorName: s.schools?.director_name ?? null,
      },
      rows,
    };
  } catch {
    return null;
  }
}

// ── Présence des élèves ─────────────────────────────────────────────
export type StudentAttendanceMap = Record<string, string>; // studentId -> status

export async function getStudentAttendanceForDate(
  studentIds: string[],
  date: string
): Promise<StudentAttendanceMap> {
  if (!isLiveMode() || studentIds.length === 0) return {};
  try {
    const svc = service();
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
      .is("archived_at", null)
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

// ── Historique des notes (toutes les notes saisies par le prof) ──────
export type GradeHistoryRow = {
  id: string;
  dateIso: string;       // graded_at (yyyy-mm-dd) — pour le tri/filtre
  dateFr: string;        // date formatée (jj/mm/aaaa)
  schoolYear: string;    // ex. "2025–2026"
  trimester: number;     // 1-4
  trimesterShort: string;// "T1"
  className: string;
  studentName: string;
  subjectName: string;
  kind: string;
  score: number;
  max: number;
  coefficient: number;
  out20: number;         // note ramenée sur 20
  mention: string;       // appréciation dérivée de out20
};

function mentionFor(out20: number): string {
  if (out20 >= 16) return "Excellent";
  if (out20 >= 14) return "Très bien";
  if (out20 >= 12) return "Bien";
  if (out20 >= 10) return "Assez bien";
  return "Insuffisant";
}

// Toutes les notes que le professeur connecté a saisies, des plus récentes
// aux plus anciennes. Alimente la rubrique « Historique des notes ».
export async function listTeacherGradeHistory(): Promise<GradeHistoryRow[]> {
  if (!isLiveMode()) return [];
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from("grades")
      .select("id, kind, score, max_score, coefficient, graded_at, students(full_name, class_name, option), subjects(name)")
      .eq("teacher_id", user.id)
      .is("archived_at", null)
      .order("graded_at", { ascending: false });
    return (data ?? []).map((g: any) => {
      const max = Number(g.max_score) || 0;
      const score = Number(g.score) || 0;
      const out20 = max > 0 ? +((score / max) * 20).toFixed(1) : 0;
      return {
        id: g.id,
        dateIso: typeof g.graded_at === "string" ? g.graded_at.slice(0, 10) : String(g.graded_at),
        dateFr: formatDateFr(g.graded_at),
        schoolYear: schoolYearLabel(g.graded_at),
        trimester: trimesterOf(g.graded_at),
        trimesterShort: `T${trimesterOf(g.graded_at)}`,
        className: classLabel(g.students?.class_name, g.students?.option),
        studentName: g.students?.full_name ?? "?",
        subjectName: g.subjects?.name ?? "?",
        kind: g.kind ?? "—",
        score,
        max,
        coefficient: Number(g.coefficient) || 1,
        out20,
        mention: mentionFor(out20),
      };
    });
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
      .is("archived_at", null)
      .order("due_at", { ascending: false });
    const now = Date.now();
    return (data ?? []).map((h: any) => ({
      id: h.id,
      title: h.title,
      subjectName: h.subjects?.name ?? "?",
      className: h.class_name,
      dueAt: new Date(h.due_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
      status: h.status,
      overdue: new Date(h.due_at).getTime() < now,
    }));
  } catch {
    return [];
  }
}
