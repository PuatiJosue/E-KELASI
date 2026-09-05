// Notes saisies par le professeur : récentes et historique complet.

import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/env";
import { trimesterOf, schoolYearLabel } from "@/lib/trimester";
import { formatDateFr } from "@/lib/grade-report";
import { classLabel } from "@/lib/classes";
import { parseAttachments, type Attachment } from "@/lib/attachments";

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
  attachments: Attachment[]; // sujet, corrigé ou photo joints à la saisie
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
      .select("id, kind, score, max_score, coefficient, graded_at, attachments, students(full_name, class_name, option), subjects(name)")
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
        attachments: parseAttachments(g.attachments),
      };
    });
  } catch {
    return [];
  }
}
