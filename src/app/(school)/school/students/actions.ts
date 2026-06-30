"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/db";

type Result = { ok: true } | { ok: false; message: string };

export async function addStudentAction(args: { fullName: string; className: string; gradeLevel: string; option?: string }): Promise<Result> {
  if (!isLiveMode()) return { ok: true };
  if (!args.fullName?.trim() || !args.className?.trim() || !args.gradeLevel?.trim()) {
    return { ok: false, message: "Le nom, la classe et le niveau sont requis." };
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
    full_name: args.fullName.trim(),
    class_name: args.className.trim(),
    grade_level: args.gradeLevel.trim(),
    option: args.option?.trim() || null,
    status: "active",
  });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/school/students");
  revalidatePath("/school/overview");
  revalidatePath("/school/student-attendance");
  return { ok: true };
}
