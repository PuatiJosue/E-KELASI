// Indicateurs de la console école : effectifs, distribution des cotes, performance.

import { createClient } from "@/lib/supabase/server";
import { serviceClient } from "@/lib/supabase/service";
import { isLiveMode } from "@/lib/env";
import { classKey } from "@/lib/classes";
import { getMySchool } from "./profile";
import { listSchoolStudents } from "./people";

export type SchoolKpis = {
  students: number;
  teachers: number;
  parentsPaying: number;
  classes: number;
  gradesThisMonth: number;
  homeworkActive: number;
};

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

export type GradeBand = { key: string; fr: string; en: string; color: string; count: number };

export async function getGradeDistribution(): Promise<{ bands: GradeBand[]; total: number }> {
  const bands: GradeBand[] = [
    { key: "exc", fr: "Excellent (16-20)", en: "Excellent (16-20)", color: "#4F66E8", count: 0 },
    { key: "bien", fr: "Bien (14-16)", en: "Good (14-16)", color: "#8B5CF6", count: 0 },
    { key: "ab", fr: "Assez bien (12-14)", en: "Fair (12-14)", color: "#14B8A6", count: 0 },
    { key: "pass", fr: "Passable (10-12)", en: "Pass (10-12)", color: "#D97706", count: 0 },
    { key: "insuf", fr: "Insuffisant (<10)", en: "Below pass (<10)", color: "#E11D48", count: 0 },
  ];
  const students = await listSchoolStudents();
  let total = 0;
  for (const s of students) {
    if (s.avg === null) continue;
    total += 1;
    if (s.avg >= 16) bands[0].count += 1;
    else if (s.avg >= 14) bands[1].count += 1;
    else if (s.avg >= 12) bands[2].count += 1;
    else if (s.avg >= 10) bands[3].count += 1;
    else bands[4].count += 1;
  }
  return { bands, total };
}

export type PerfPoint = { label: string; avg: number | null; attendancePct: number | null };

export async function getSchoolPerformance6m(): Promise<PerfPoint[]> {
  if (!isLiveMode()) return [];
  try {
    const school = await getMySchool();
    if (!school) return [];
    const svc: any = serviceClient();

    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const startDay = start.toISOString().slice(0, 10);

    const { data: studs } = await svc.from("students").select("id").eq("school_id", school.id);
    const ids = (studs ?? []).map((s: any) => s.id);

    let grades: any[] = [];
    if (ids.length > 0) {
      const { data } = await svc
        .from("grades")
        .select("score, max_score, graded_at")
        .in("student_id", ids)
        .gte("graded_at", startDay);
      grades = data ?? [];
    }

    const { data: att } = await svc
      .from("student_attendance")
      .select("status, date")
      .eq("school_id", school.id)
      .gte("date", startDay);

    type Bucket = { key: string; label: string; gSum: number; gN: number; aPres: number; aTot: number };
    const months: Bucket[] = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString("fr-FR", { month: "short" }), gSum: 0, gN: 0, aPres: 0, aTot: 0 });
    }
    const indexOf = (dateStr: string) => {
      const d = new Date(dateStr);
      return months.findIndex((m) => m.key === `${d.getFullYear()}-${d.getMonth()}`);
    };

    for (const g of grades) {
      const i = indexOf(g.graded_at);
      if (i < 0) continue;
      const max = Number(g.max_score) || 20;
      const sc = Number(g.score);
      if (!isNaN(sc) && max > 0) {
        months[i].gSum += (sc / max) * 20;
        months[i].gN += 1;
      }
    }
    for (const a of att ?? []) {
      const i = indexOf(a.date);
      if (i < 0) continue;
      months[i].aTot += 1;
      if (a.status === "present" || a.status === "late" || a.status === "justified") months[i].aPres += 1;
    }

    return months.map((m) => ({
      label: m.label,
      avg: m.gN > 0 ? +(m.gSum / m.gN).toFixed(1) : null,
      attendancePct: m.aTot > 0 ? Math.round((m.aPres / m.aTot) * 100) : null,
    }));
  } catch {
    return [];
  }
}
