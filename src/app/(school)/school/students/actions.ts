"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/db";

type Result = { ok: true } | { ok: false; message: string };

export type ImportRow = { fullName: string; className: string; gradeLevel?: string; option?: string };
type ImportResult = { ok: true; inserted: number } | { ok: false; message: string };

/** Import en masse d'élèves (collage Excel / CSV). Une seule insertion. */
export async function importStudentsAction(args: { rows: ImportRow[] }): Promise<ImportResult> {
  if (!isLiveMode()) return { ok: true, inserted: 0 };

  const clean = (args.rows ?? [])
    .map((r) => ({
      fullName: (r.fullName ?? "").trim(),
      className: (r.className ?? "").trim(),
      gradeLevel: (r.gradeLevel ?? "").trim(),
      option: (r.option ?? "").trim(),
    }))
    .filter((r) => r.fullName && r.className);

  if (clean.length === 0) return { ok: false, message: "Aucune ligne valide (nom + classe requis)." };
  if (clean.length > 500) return { ok: false, message: "Maximum 500 élèves par import." };

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

  const rows = clean.map((r) => ({
    school_id: staff.school_id,
    full_name: r.fullName,
    class_name: r.className,
    grade_level: r.gradeLevel || r.className,
    option: r.option || null,
    status: "active",
  }));

  const { error } = await supabase.from("students").insert(rows);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/school/students");
  revalidatePath("/school/overview");
  revalidatePath("/school/student-attendance");
  return { ok: true, inserted: rows.length };
}

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
