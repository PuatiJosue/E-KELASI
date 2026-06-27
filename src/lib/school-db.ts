// Server-side data layer pour la console direction d'école.

import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/db";
import { TRIMESTERS, trimesterOf, currentTrimester } from "@/lib/trimester";
import { classLabel, classKey, normOption } from "@/lib/classes";

// Agrège une liste de cotes en moyennes par matière + moyenne générale.
function aggregateGrades(grades: any[]): { subjects: DossierSubject[]; overallAvg: number } {
  const bySubject: Record<string, { name: string; short: string; sum: number; coef: number; items: any[] }> = {};
  for (const g of grades) {
    const name = g.subjects?.name ?? "?";
    if (!bySubject[name]) bySubject[name] = { name, short: g.subjects?.short_name ?? "", sum: 0, coef: 0, items: [] };
    bySubject[name].sum += (g.score / g.max_score) * 20 * g.coefficient;
    bySubject[name].coef += g.coefficient;
    bySubject[name].items.push(g);
  }
  const subjects = Object.values(bySubject).map((su) => ({
    name: su.name,
    short: su.short,
    avg: su.coef > 0 ? +(su.sum / su.coef).toFixed(2) : 0,
    items: su.items,
  }));
  const overallAvg = subjects.length ? +(subjects.reduce((a, su) => a + su.avg, 0) / subjects.length).toFixed(2) : 0;
  return { subjects, overallAvg };
}

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
  commune: string | null;
  quartier: string | null;
  address: string | null;
  phone: string | null;
  directorName: string | null;
  signatureUrl: string | null;
  currentYear: string | null;
  email: string | null;
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
  avatarUrl: string | null;
  sex: string | null;
  birthDate: string | null;
  option: string | null;
};

export type ClassDirectoryRow = {
  className: string;        // class_name brut
  option: string | null;   // option/filière
  label: string;           // « Niveau — Option » pour l'affichage
  studentCount: number;
  teacherCount: number;
  teacherNames: string[];
  avg: number | null;
};

export type DossierSubject = { name: string; short: string; avg: number; items: any[] };
export type DossierTrimester = {
  index: number;
  short: string;
  fr: string;
  en: string;
  subjects: DossierSubject[];
  overallAvg: number;
  count: number;
};

export type StudentDossier = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  sex: string | null;
  birthDate: string | null;
  className: string;
  option: string | null;
  schoolName: string | null;
  status: string;
  parents: { name: string; email: string; phone: string | null; access: string }[];
  subjects: DossierSubject[];
  overallAvg: number;
  trimesters: DossierTrimester[];
};

export type ClassWithAvg = {
  className: string;
  option: string | null;
  label: string;
  studentCount: number;
  avg: number | null;
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
      commune: null,
      quartier: null,
      address: null,
      phone: null,
      directorName: null,
      signatureUrl: null,
      currentYear: null,
      email: null,
    };
  }
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: staff } = await supabase
      .from("school_staff")
      .select("schools(id, name, slug, city, country_code, plan, status, brand_color, logo_url, commune, quartier, address, phone, director_name, signature_url, current_year, email)")
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
      commune: s.commune,
      quartier: s.quartier,
      address: s.address,
      phone: s.phone,
      directorName: s.director_name ?? null,
      signatureUrl: s.signature_url ?? null,
      currentYear: s.current_year ?? null,
      email: s.email ?? null,
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
      supabase.from("students").select("class_name, option").eq("school_id", school.id),
      supabase
        .from("school_staff")
        .select("*", { count: "exact", head: true })
        .eq("school_id", school.id)
        .eq("role", "teacher"),
    ]);

    // Une classe = couple (class_name, option) → on compte les clés distinctes.
    const classes = new Set(
      (students2 ?? []).filter((s: any) => s.class_name).map((s: any) => classKey(s.class_name, s.option))
    ).size;

    // grades du mois en cours
    const monthStart = new Date();
    monthStart.setDate(1);
    const studentIds = (students2 ?? []).map((s: any) => s.id);
    let gradesThisMonth = 0;
    if (studentIds.length > 0) {
      const { count } = await supabase
        .from("grades")
        .select("*", { count: "exact", head: true })
        .gte("created_at", monthStart.toISOString())
        .is("archived_at", null);
      gradesThisMonth = count ?? 0;
    }

    // devoirs actifs : status todo ou inprogress
    const { count: hw } = await supabase
      .from("homework")
      .select("*", { count: "exact", head: true })
      .in("status", ["todo", "inprogress"])
      .is("archived_at", null);

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

export async function listClassesWithAvg(): Promise<ClassWithAvg[]> {
  const students = await listSchoolStudents();
  const grouped: Record<string, { className: string; option: string | null; count: number; sum: number; n: number }> = {};
  for (const s of students) {
    const option = normOption(s.option);
    const key = classKey(s.className, option);
    if (!grouped[key]) grouped[key] = { className: s.className, option, count: 0, sum: 0, n: 0 };
    grouped[key].count++;
    if (s.avg !== null) {
      grouped[key].sum += s.avg;
      grouped[key].n++;
    }
  }
  return Object.values(grouped).map((g) => ({
    className: g.className,
    option: g.option,
    label: classLabel(g.className, g.option),
    studentCount: g.count,
    avg: g.n > 0 ? +(g.sum / g.n).toFixed(1) : null,
  }));
}

// ── Rapport global des classes : taux de réussite par niveau × option ──
export type ClassReportLevel = {
  key: string;
  label: string;
  group: "base" | "secondaire";
  byOption: Record<string, number | null>; // moyenne /20 par option
  overall: number | null;                   // moyenne /20 du niveau
  students: number;
};
export type ClassReportMatrix = {
  levels: ClassReportLevel[];
  options: string[];
  best: { label: string; value: number } | null;
  worst: { label: string; value: number } | null;
  avgRatePct: number | null; // taux moyen de réussite (%)
  totalStudents: number;
};

// Liste canonique des niveaux (système congolais), de la 1re primaire aux humanités.
// Le primaire est « libre » (sans option) ; les options ne concernent que les humanités.
const REPORT_LEVELS: { key: string; label: string; group: "base" | "secondaire" }[] = [
  { key: "p1", label: "1re année primaire", group: "base" },
  { key: "p2", label: "2e année primaire", group: "base" },
  { key: "p3", label: "3e année primaire", group: "base" },
  { key: "p4", label: "4e année primaire", group: "base" },
  { key: "p5", label: "5e année primaire", group: "base" },
  { key: "p6", label: "6e année primaire", group: "base" },
  { key: "b7", label: "7e année du primaire", group: "base" },
  { key: "b8", label: "8e année du primaire", group: "base" },
  { key: "h1", label: "1re année des humanités", group: "secondaire" },
  { key: "h2", label: "2e année des humanités", group: "secondaire" },
  { key: "h3", label: "3e année des humanités", group: "secondaire" },
  { key: "h4", label: "4e année des humanités", group: "secondaire" },
];

// Domaines/options officiels de l'enseignement secondaire (RDC) + Professionnelle.
const REPORT_OPTIONS = ["Sciences", "Technique", "Commercial et gestion", "Pédagogie", "Littéraire", "Nutrition", "Arts et métiers", "Professionnelle"];

const norm = (s: string) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

function levelKeyOf(raw: string): string | null {
  const s = norm(raw);
  const digit = (s.match(/(\d+)/)?.[1]) ?? "";
  if (s.includes("primaire")) {
    if (digit && +digit >= 1 && +digit <= 6) return `p${digit}`;
    // 7e / 8e année du primaire (anciennement « éducation de base »).
    if (digit === "7") return "b7";
    if (digit === "8") return "b8";
    return null;
  }
  if (s.includes("humanit") || s.includes("secondaire")) return digit && +digit >= 1 && +digit <= 4 ? `h${digit}` : null;
  // Compatibilité avec les anciens libellés « 7e/8e année (éducation de base) ».
  if (s.includes("base") || s.includes("annee")) {
    if (s.includes("7")) return "b7";
    if (s.includes("8")) return "b8";
  }
  return null;
}

function optionLabelOf(raw: string | null): string | null {
  const s = norm(raw ?? "");
  if (!s) return null;
  if (s.includes("profession")) return "Professionnelle";
  if (s.includes("pedagog")) return "Pédagogie";
  if (s.includes("commerc") || s.includes("gestion") || s.includes("comptab")) return "Commercial et gestion";
  if (s.includes("nutri") || s.includes("hotel") || s.includes("restaur")) return "Nutrition";
  if (s.includes("art") || s.includes("couture") || s.includes("esthet") || s.includes("artisan") || s.includes("coupe")) return "Arts et métiers";
  if (s.includes("litt") || s.includes("latin") || s.includes("philo") || s.includes("langue")) return "Littéraire";
  if (s.includes("techni") || s.includes("electr") || s.includes("mecani") || s.includes("construc") || s.includes("informat")) return "Technique";
  if (s.includes("scien") || s.includes("math") || s.includes("physi") || s.includes("bio") || s.includes("chimi")) return "Sciences";
  return null;
}

export async function getClassReportMatrix(): Promise<ClassReportMatrix> {
  const empty: ClassReportMatrix = { levels: [], options: REPORT_OPTIONS, best: null, worst: null, avgRatePct: null, totalStudents: 0 };
  if (!isLiveMode()) return empty;
  try {
    const students = await listSchoolStudents();
    // Accumulateurs : somme + n par (niveau, option) et par niveau.
    const cell = new Map<string, { sum: number; n: number }>(); // key: levelKey|option
    const lvl = new Map<string, { sum: number; n: number; students: number }>();
    let gSum = 0, gN = 0;

    for (const st of students) {
      const lk = levelKeyOf(st.gradeLevel || st.className);
      if (!lk) continue;
      const lv = lvl.get(lk) ?? { sum: 0, n: 0, students: 0 };
      lv.students += 1;
      if (st.avg !== null) {
        lv.sum += st.avg; lv.n += 1;
        gSum += st.avg; gN += 1;
        const ok = optionLabelOf(st.option);
        if (ok) {
          const ck = `${lk}|${ok}`;
          const c = cell.get(ck) ?? { sum: 0, n: 0 };
          c.sum += st.avg; c.n += 1;
          cell.set(ck, c);
        }
      }
      lvl.set(lk, lv);
    }

    const levels: ClassReportLevel[] = REPORT_LEVELS.map((L) => {
      const byOption: Record<string, number | null> = {};
      for (const opt of REPORT_OPTIONS) {
        const c = cell.get(`${L.key}|${opt}`);
        byOption[opt] = c && c.n > 0 ? +(c.sum / c.n).toFixed(1) : null;
      }
      const lv = lvl.get(L.key);
      return {
        key: L.key,
        label: L.label,
        group: L.group,
        byOption,
        overall: lv && lv.n > 0 ? +(lv.sum / lv.n).toFixed(1) : null,
        students: lv?.students ?? 0,
      };
    });

    // Meilleure / pire performance (parmi les cellules option×niveau renseignées).
    let best: { label: string; value: number } | null = null;
    let worst: { label: string; value: number } | null = null;
    for (const L of levels) {
      for (const opt of REPORT_OPTIONS) {
        const v = L.byOption[opt];
        if (v === null) continue;
        const label = `${opt} · ${L.label}`;
        if (!best || v > best.value) best = { label, value: v };
        if (!worst || v < worst.value) worst = { label, value: v };
      }
    }

    return {
      levels,
      options: REPORT_OPTIONS,
      best,
      worst,
      avgRatePct: gN > 0 ? Math.round((gSum / gN / 20) * 100) : null,
      totalStudents: students.length,
    };
  } catch {
    return empty;
  }
}

// Annuaire : effectifs élèves + enseignants par classe (+ moyenne).
export async function getClassDirectory(): Promise<{
  rows: ClassDirectoryRow[];
  totalStudents: number;
  totalTeachers: number;
}> {
  if (!isLiveMode()) return { rows: [], totalStudents: 0, totalTeachers: 0 };
  try {
    const supabase = createClient();
    const school = await getMySchool();
    if (!school) return { rows: [], totalStudents: 0, totalTeachers: 0 };

    const students = await listSchoolStudents();

    // Enseignants de l'école + leurs noms.
    const { data: staff } = await supabase
      .from("school_staff")
      .select("user_id, profiles(full_name)")
      .eq("school_id", school.id)
      .eq("role", "teacher");
    const teacherName = new Map<string, string>();
    const teacherIds: string[] = [];
    for (const s of staff ?? []) {
      if ((s as any).user_id) {
        teacherIds.push((s as any).user_id);
        teacherName.set((s as any).user_id, (s as any).profiles?.full_name ?? "");
      }
    }

    // Quels enseignants interviennent dans quelle classe (via les devoirs).
    const teachersByClass: Record<string, Set<string>> = {};
    if (teacherIds.length > 0) {
      const { data: hw } = await supabase
        .from("homework")
        .select("class_name, teacher_id")
        .in("teacher_id", teacherIds);
      for (const h of hw ?? []) {
        const c = (h as any).class_name;
        if (!c || !(h as any).teacher_id) continue;
        (teachersByClass[c] ||= new Set()).add((h as any).teacher_id);
      }
    }

    // Regroupe les élèves par classe (couple class_name + option).
    const byClass: Record<string, { className: string; option: string | null; list: SchoolStudentRow[] }> = {};
    for (const s of students) {
      const option = normOption(s.option);
      const key = classKey(s.className, option);
      (byClass[key] ||= { className: s.className, option, list: [] }).list.push(s);
    }

    const rows: ClassDirectoryRow[] = Object.values(byClass)
      .map(({ className, option, list }) => {
        const withAvg = list.filter((s) => s.avg !== null) as { avg: number }[];
        const avg = withAvg.length ? +(withAvg.reduce((a, s) => a + s.avg, 0) / withAvg.length).toFixed(1) : null;
        // Les devoirs n'ont pas d'option : on réutilise les profs du niveau pour chaque option.
        const tset = teachersByClass[className] ?? new Set<string>();
        return {
          className,
          option,
          label: classLabel(className, option),
          studentCount: list.length,
          teacherCount: tset.size,
          teacherNames: [...tset].map((id) => teacherName.get(id) ?? "").filter(Boolean),
          avg,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));

    return { rows, totalStudents: students.length, totalTeachers: teacherIds.length };
  } catch {
    return { rows: [], totalStudents: 0, totalTeachers: 0 };
  }
}

// Dossier complet d'un élève (identité + parents + scolarité).
export async function getStudentDossier(studentId: string): Promise<StudentDossier | null> {
  if (!isLiveMode()) return null;
  try {
    const supabase = createClient();
    const school = await getMySchool();
    if (!school) return null;

    const { data: s } = await supabase
      .from("students")
      .select("id, full_name, avatar_url, sex, birth_date, class_name, option, status, school_id, schools(name)")
      .eq("id", studentId)
      .eq("school_id", school.id)
      .maybeSingle();
    if (!s) return null;

    const { data: links } = await supabase
      .from("parent_links")
      .select("access_status, profiles!parent_links_parent_id_fkey(full_name, email, phone)")
      .eq("student_id", studentId);
    const parents = (links ?? []).map((l: any) => ({
      name: l.profiles?.full_name ?? "—",
      email: l.profiles?.email ?? "",
      phone: l.profiles?.phone ?? null,
      access: l.access_status ?? "active",
    }));

    const { data: grades } = await supabase
      .from("grades")
      .select("kind, score, max_score, coefficient, graded_at, comment, subjects(name, short_name)")
      .eq("student_id", studentId)
      .is("archived_at", null)
      .order("graded_at", { ascending: false });

    const { subjects, overallAvg } = aggregateGrades(grades ?? []);

    // Regroupement des cotations par trimestre (dossiers).
    const trimesters: DossierTrimester[] = TRIMESTERS.map((meta) => {
      const gradesT = (grades ?? []).filter((g: any) => trimesterOf(g.graded_at) === meta.index);
      const agg = aggregateGrades(gradesT);
      return {
        index: meta.index,
        short: meta.short,
        fr: meta.fr,
        en: meta.en,
        subjects: agg.subjects,
        overallAvg: agg.overallAvg,
        count: gradesT.length,
      };
    }).filter((tr) => tr.count > 0);

    return {
      id: (s as any).id,
      fullName: (s as any).full_name,
      avatarUrl: (s as any).avatar_url ?? null,
      sex: (s as any).sex ?? null,
      birthDate: (s as any).birth_date ?? null,
      className: (s as any).class_name ?? "—",
      option: (s as any).option ?? null,
      schoolName: (s as any).schools?.name ?? null,
      status: (s as any).status,
      parents,
      subjects,
      overallAvg,
      trimesters,
    };
  } catch {
    return null;
  }
}

export async function getStudentReportData(studentId: string, trimester?: number) {
  if (!isLiveMode()) return null;
  try {
    const supabase = createClient();
    const tri = trimester ?? currentTrimester();
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
      .is("archived_at", null)
      .order("graded_at", { ascending: false });

    // On ne garde que les cotes du trimestre demandé.
    const gradesT = (grades ?? []).filter((g: any) => trimesterOf(g.graded_at) === tri);
    const { subjects, overallAvg } = aggregateGrades(gradesT);
    const meta = TRIMESTERS.find((m) => m.index === tri) ?? TRIMESTERS[0];

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
      trimester: { index: meta.index, short: meta.short, fr: meta.fr, en: meta.en },
    };
  } catch {
    return null;
  }
}
