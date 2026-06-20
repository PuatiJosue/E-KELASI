"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/db";
import { resolveOrCreateSubjectId } from "@/lib/subjects-db";

type Args = {
  className: string;
  subjectName: string;
  title: string;
  description: string | null;
  dueAt: string;
};

type Result = { ok: true } | { ok: false; message: string };

export async function createHomeworkAction(args: Args): Promise<Result> {
  if (!isLiveMode()) return { ok: true };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Non authentifié" };

  if (!args.subjectName?.trim()) return { ok: false, message: "Indique une matière." };

  // École du prof (pour rattacher / créer la matière).
  const { data: staff } = await supabase
    .from("school_staff")
    .select("school_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!staff?.school_id) return { ok: false, message: "Aucune école rattachée à ce compte." };

  const subjectId = await resolveOrCreateSubjectId(staff.school_id, args.subjectName);
  if (!subjectId) return { ok: false, message: "Matière invalide." };

  const { data: hw, error } = await supabase
    .from("homework")
    .insert({
      subject_id: subjectId,
      teacher_id: user.id,
      class_name: args.className,
      title: args.title,
      description: args.description,
      due_at: args.dueAt,
      status: "todo",
    })
    .select("id")
    .single();
  if (error) return { ok: false, message: error.message };

  // Notif aux parents des élèves de cette classe (best effort)
  try {
    // récupère students de la classe
    const { data: school } = await supabase
      .from("school_staff")
      .select("school_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (school?.school_id) {
      const { data: students } = await supabase
        .from("students")
        .select("id")
        .eq("school_id", school.school_id)
        .eq("class_name", args.className);
      const studentIds = (students ?? []).map((s: any) => s.id);
      if (studentIds.length > 0) {
        const { data: links } = await supabase
          .from("parent_links")
          .select("parent_id")
          .in("student_id", studentIds);
        const parentIds = [...new Set((links ?? []).map((l: any) => l.parent_id))];
        if (parentIds.length > 0) {
          const dueDate = new Date(args.dueAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
          const rows = parentIds.map((pid) => ({
            user_id: pid as string,
            kind: "hw" as const,
            body: `Nouveau devoir : ${args.title} · à rendre le ${dueDate}`,
          }));
          await supabase.from("notifications").insert(rows);
        }
      }
    }
  } catch {
    // notif optionnelle
  }

  revalidatePath("/teacher/homework");
  revalidatePath("/teacher/dashboard");
  return { ok: true };
}
