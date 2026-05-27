// Server-side data layer pour la console direction d'école.

import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/db";

export type MySchool = {
  id: string;
  name: string;
  slug: string;
  city: string;
  countryCode: string;
  plan: "standard" | "pro";
  status: string;
  brandColor: string | null;
  logoUrl: string | null;
};

export type SchoolKpis = {
  students: number;
  teachers: number;
  parentsPaying: number;
  classes: number;
  gradesThisMonth: number;
  homeworkActive: number;
};

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
};

export type ClassWithAvg = {
  className: string;
  studentCount: number;
  avg: number | null;
};

export async function getMySchool(): Promise<MySchool | null> {
  if (!isLiveMode()) {
    return {
      id: "demo",
      name: "Lycée Albert-Camus",
      slug: "lycee-albert-camus",
      city: "Dakar",
      countryCode: "SN",
      plan: "pro",
      status: "active",
      brandColor: null,
      logoUrl: null,
    };
  }
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: staff } = await supabase
      .from("school_staff")
      .select("schools(id, name, slug, city, country_code, plan, status, brand_color, logo_url)")
      .eq("user_id", user.id)
      .eq("role", "school_admin")
      .limit(1)
      .maybeSingle();
    const s = (staff as any)?.schools;
    if (!s) return null;
    return {
      id: s.id,
      name: s.name,
      slug: s.slug,
      city: s.city,
      countryCode: s.country_code,
      plan: s.plan,
      status: s.status,
      brandColor: s.brand_color,
      logoUrl: s.logo_url,
    };
  } catch {
    return null;
  }
}

export async function getSchoolKpis(): Promise<SchoolKpis> {
  if (!isLiveMode()) {
    return { students: 28, teachers: 5, parentsPaying: 14, classes: 2, gradesThisMonth: 12, homeworkActive: 4 };
  }
  try {
    const supabase = createClient();
    const school = await getMySchool();
    if (!school) return { students: 0, teachers: 0, parentsPaying: 0, classes: 0, gradesThisMonth: 0, homeworkActive: 0 };

    const [{ count: students }, { data: students2 }, { count: teachers }] = await Promise.all([
      supabase.from("students").select("*", { count: "exact", head: true }).eq("school_id", school.id),
      supabase.from("students").select("class_name").eq("school_id", school.id),
      supabase
        .from("school_staff")
        .select("*", { count: "exact", head: true })
        .eq("school_id", school.id)
        .eq("role", "teacher"),
    ]);

    const classes = new Set((students2 ?? []).map((s: any) => s.class_name).filter(Boolean)).size;

    // grades du mois en cours
    const monthStart = new Date();
    monthStart.setDate(1);
    const studentIds = (students2 ?? []).map((s: any) => s.id);
    let gradesThisMonth = 0;
    if (studentIds.length > 0) {
      const { count } = await supabase
        .from("grades")
        .select("*", { count: "exact", head: true })
        .gte("created_at", monthStart.toISOString());
      gradesThisMonth = count ?? 0;
    }

    // devoirs actifs : status todo ou inprogress
    const { count: hw } = await supabase
      .from("homework")
      .select("*", { count: "exact", head: true })
      .in("status", ["todo", "inprogress"]);

    // parents payants : count subscriptions actives liées à des élèves de l'école
    const { data: links } = await supabase
      .from("parent_links")
      .select("parent_id")
      .in("student_id", studentIds.length > 0 ? studentIds : ["00000000-0000-0000-0000-000000000000"]);
    const parentIds = [...new Set((links ?? []).map((l: any) => l.parent_id))];
    let parentsPaying = 0;
    if (parentIds.length > 0) {
      const { count } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .in("parent_id", parentIds)
        .in("status", ["active", "trialing"]);
      parentsPaying = count ?? 0;
    }

    return {
      students: students ?? 0,
      teachers: teachers ?? 0,
      parentsPaying,
      classes,
      gradesThisMonth,
      homeworkActive: hw ?? 0,
    };
  } catch {
    return { students: 0, teachers: 0, parentsPaying: 0, classes: 0, gradesThisMonth: 0, homeworkActive: 0 };
  }
}

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
      .select("id, full_name, class_name, grade_level")
      .eq("school_id", school.id)
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
        .in("student_id", ids),
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
      };
    });
  } catch {
    return [];
  }
}

export async function listClassesWithAvg(): Promise<ClassWithAvg[]> {
  const students = await listSchoolStudents();
  const grouped: Record<string, { count: number; sum: number; n: number }> = {};
  for (const s of students) {
    const c = s.className;
    if (!grouped[c]) grouped[c] = { count: 0, sum: 0, n: 0 };
    grouped[c].count++;
    if (s.avg !== null) {
      grouped[c].sum += s.avg;
      grouped[c].n++;
    }
  }
  return Object.entries(grouped).map(([className, g]) => ({
    className,
    studentCount: g.count,
    avg: g.n > 0 ? +(g.sum / g.n).toFixed(1) : null,
  }));
}

export async function getStudentReportData(studentId: string) {
  if (!isLiveMode()) return null;
  try {
    const supabase = createClient();
    const { data: student } = await supabase
      .from("students")
      .select("id, full_name, class_name, grade_level, schools(name, city)")
      .eq("id", studentId)
      .maybeSingle();
    if (!student) return null;

    const { data: grades } = await supabase
      .from("grades")
      .select("kind, score, max_score, coefficient, graded_at, comment, subjects(name, short_name)")
      .eq("student_id", studentId)
      .order("graded_at", { ascending: false });

    // moyenne par matière
    const bySubject: Record<string, { name: string; short: string; sum: number; coef: number; items: any[] }> = {};
    for (const g of grades ?? []) {
      const name = (g as any).subjects?.name ?? "?";
      if (!bySubject[name]) {
        bySubject[name] = { name, short: (g as any).subjects?.short_name ?? "", sum: 0, coef: 0, items: [] };
      }
      bySubject[name].sum += ((g as any).score / (g as any).max_score) * 20 * (g as any).coefficient;
      bySubject[name].coef += (g as any).coefficient;
      bySubject[name].items.push(g);
    }
    const subjects = Object.values(bySubject).map((s) => ({
      name: s.name,
      short: s.short,
      avg: s.coef > 0 ? +(s.sum / s.coef).toFixed(2) : 0,
      items: s.items,
    }));

    const overallAvg =
      subjects.length > 0
        ? +(subjects.reduce((a, s) => a + s.avg, 0) / subjects.length).toFixed(2)
        : 0;

    return {
      student: {
        id: student.id,
        fullName: student.full_name,
        className: student.class_name,
        schoolName: (student as any).schools?.name,
        schoolCity: (student as any).schools?.city,
      },
      subjects,
      overallAvg,
    };
  } catch {
    return null;
  }
}
