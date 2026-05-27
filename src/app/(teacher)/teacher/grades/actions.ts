"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/db";

export type GradeInput = { studentId: string; score: number };

type SubmitArgs = {
  subjectId: string;
  kind: string;
  maxScore: number;
  coefficient: number;
  gradedAt: string;
  items: GradeInput[];
};

type Result = { ok: true; count: number } | { ok: false; message: string };

export async function submitGradesAction(args: SubmitArgs): Promise<Result> {
  if (!isLiveMode()) return { ok: true, count: args.items.length };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Non authentifié" };

  if (args.items.length === 0) return { ok: false, message: "Aucune note à enregistrer" };

  // Validation simple
  for (const it of args.items) {
    if (isNaN(it.score) || it.score < 0 || it.score > args.maxScore) {
      return { ok: false, message: `Note invalide pour un élève (doit être entre 0 et ${args.maxScore})` };
    }
  }

  const rows = args.items.map((it) => ({
    student_id: it.studentId,
    subject_id: args.subjectId,
    teacher_id: user.id,
    kind: args.kind,
    score: it.score,
    max_score: args.maxScore,
    coefficient: args.coefficient,
    graded_at: args.gradedAt,
  }));

  const { error } = await supabase.from("grades").insert(rows);
  if (error) return { ok: false, message: error.message };

  // Notif parents (best effort)
  try {
    const { data: links } = await supabase
      .from("parent_links")
      .select("parent_id, student_id, students(full_name), profiles!parent_links_parent_id_fkey(id)")
      .in("student_id", args.items.map((i) => i.studentId));

    const notifs = (links ?? [])
      .map((l: any) => {
        const item = args.items.find((i) => i.studentId === l.student_id);
        if (!item) return null;
        return {
          user_id: l.parent_id,
          kind: "grade" as const,
          body: `Nouvelle note pour ${l.students?.full_name ?? "votre enfant"} : ${item.score}/${args.maxScore} (${args.kind})`,
        };
      })
      .filter(Boolean);
    if (notifs.length > 0) {
      await supabase.from("notifications").insert(notifs as any[]);
    }
  } catch {
    // Si la notif échoue, on ne fait pas échouer la saisie des notes.
  }

  revalidatePath("/teacher/grades");
  revalidatePath("/teacher/dashboard");
  return { ok: true, count: args.items.length };
}
