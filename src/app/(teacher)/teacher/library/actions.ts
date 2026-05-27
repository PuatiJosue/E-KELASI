"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/db";

type AddArgs = {
  title: string;
  author: string;
  description: string | null;
  coverUrl: string | null;
  subjectId: string | null;
  gradeLevel: string | null;
};

type Result = { ok: true } | { ok: false; message: string };

export async function addBookAction(args: AddArgs): Promise<Result> {
  if (!isLiveMode()) return { ok: true };
  if (!args.title || !args.author) return { ok: false, message: "Titre et auteur requis." };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Non authentifié" };

  // Trouve l'école du prof
  const { data: staff } = await supabase
    .from("school_staff")
    .select("school_id")
    .eq("user_id", user.id)
    .in("role", ["teacher", "school_admin"])
    .limit(1)
    .maybeSingle();
  if (!staff) return { ok: false, message: "Aucune école associée à ton compte." };

  const { error } = await supabase.from("library_books").insert({
    school_id: staff.school_id,
    added_by: user.id,
    subject_id: args.subjectId,
    title: args.title,
    author: args.author,
    description: args.description,
    cover_url: args.coverUrl,
    grade_level: args.gradeLevel,
  });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/teacher/library");
  return { ok: true };
}

export async function deleteBookAction(id: string): Promise<Result> {
  if (!isLiveMode()) return { ok: true };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Non authentifié" };

  const { error } = await supabase.from("library_books").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/teacher/library");
  return { ok: true };
}
