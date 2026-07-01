"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/db";
import { studentKey } from "@/lib/student-import";

type Result = { ok: true } | { ok: false; message: string };

export type ImportRow = { fullName: string; className: string; gradeLevel?: string; option?: string };
type ImportResult = { ok: true; inserted: number; duplicates: number } | { ok: false; message: string };

/** Import en masse d'élèves (collage Excel / CSV) avec saut des doublons. */
export async function importStudentsAction(args: { rows: ImportRow[] }): Promise<ImportResult> {
  if (!isLiveMode()) return { ok: true, inserted: 0, duplicates: 0 };

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

  // Élèves déjà présents → on évite de recréer un doublon (nom + classe).
  const { data: existing } = await supabase
    .from("students")
    .select("full_name, class_name")
    .eq("school_id", staff.school_id);
  const seen = new Set<string>((existing ?? []).map((s: any) => studentKey(s.full_name ?? "", s.class_name ?? "")));

  let duplicates = 0;
  const rows: any[] = [];
  for (const r of clean) {
    const key = studentKey(r.fullName, r.className);
    if (seen.has(key)) { duplicates += 1; continue; } // déjà en base ou en double dans le lot
    seen.add(key);
    rows.push({
      school_id: staff.school_id,
      full_name: r.fullName,
      class_name: r.className,
      grade_level: r.gradeLevel || r.className,
      option: r.option || null,
      status: "active",
    });
  }

  if (rows.length === 0) return { ok: false, message: `Aucun nouvel élève : ${duplicates} doublon(s) ignoré(s).` };

  const { error } = await supabase.from("students").insert(rows);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/school/students");
  revalidatePath("/school/overview");
  revalidatePath("/school/student-attendance");
  return { ok: true, inserted: rows.length, duplicates };
}

export async function addStudentAction(args: {
  lastName: string;      // Nom
  middleName?: string;   // Post-nom
  firstName: string;     // Prénom
  sex?: string;          // 'M' | 'F'
  className: string;
  option?: string;
  gradeLevel?: string;   // facultatif → défaut = classe
}): Promise<Result> {
  if (!isLiveMode()) return { ok: true };
  const lastName = args.lastName?.trim();
  const firstName = args.firstName?.trim();
  const middleName = args.middleName?.trim() || null;
  const className = args.className?.trim();
  if (!lastName || !firstName || !className) {
    return { ok: false, message: "Nom, prénom et classe sont requis." };
  }
  const sex = args.sex === "M" || args.sex === "F" ? args.sex : null;
  const fullName = [lastName, middleName, firstName].filter(Boolean).join(" ");

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
    full_name: fullName,
    first_name: firstName,
    middle_name: middleName,
    last_name: lastName,
    sex,
    class_name: className,
    grade_level: args.gradeLevel?.trim() || className,
    option: args.option?.trim() || null,
    status: "active",
  });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/school/students");
  revalidatePath("/school/overview");
  revalidatePath("/school/student-attendance");
  return { ok: true };
}
