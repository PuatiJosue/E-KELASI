"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/db";

type Result = { ok: true } | { ok: false; message: string };

export async function addStudentAction(args: { fullName: string; className: string; gradeLevel: string }): Promise<Result> {
  if (!isLiveMode()) return { ok: true };
  if (!args.fullName || !args.className || !args.gradeLevel) {
    return { ok: false, message: "Tous les champs sont requis." };
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Non authentifié" };

  const { data: staff } = await supabase
    .from("school_staff")
    .select("school_id")
    .eq("user_id", user.id)
    .eq("role", "school_admin")
    .maybeSingle();
  if (!staff) return { ok: false, message: "Vous n'êtes pas direction d'une école." };

  const { error } = await supabase.from("students").insert({
    school_id: staff.school_id,
    full_name: args.fullName,
    class_name: args.className,
    grade_level: args.gradeLevel,
  });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/school/students");
  revalidatePath("/school/overview");
  return { ok: true };
}
