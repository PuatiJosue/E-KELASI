// Devoirs publiés par le professeur.

import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/env";
import { parseAttachments, type Attachment } from "@/lib/attachments";

export type HomeworkRow = {
  id: string;
  title: string;
  subjectName: string;
  className: string;
  dueAt: string;
  status: string;
  overdue: boolean;
  attachments: Attachment[];   // énoncé, feuille d'exercices ou photo jointe
};

export async function listTeacherHomework(): Promise<HomeworkRow[]> {
  if (!isLiveMode()) return [];
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
      .from("homework")
      .select("id, title, class_name, due_at, status, attachments, subjects(name)")
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
      attachments: parseAttachments(h.attachments),
    }));
  } catch {
    return [];
  }
}
