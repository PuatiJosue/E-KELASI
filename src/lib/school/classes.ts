// Classes : moyennes, annuaire et rapport de réussite par niveau × option.

import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/env";
import { classLabel, classKey, normOption } from "@/lib/classes";
import { getMySchool } from "./profile";
import { listSchoolStudents } from "./people";
import type { SchoolStudentRow } from "./people";

export type ClassDirectoryRow = {
  className: string;        // class_name brut
  option: string | null;   // option/filière
  label: string;           // « Niveau — Option » pour l'affichage
  studentCount: number;
  teacherCount: number;
  teacherNames: string[];
  avg: number | null;
};

export type ClassWithAvg = {
  className: string;
  option: string | null;
  label: string;
  studentCount: number;
  avg: number | null;
};

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
