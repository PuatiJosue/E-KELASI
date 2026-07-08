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

export type StudentDocument = { name: string; url: string };

export async function addStudentAction(args: {
  lastName: string;      // Nom
  middleName?: string;   // Post-nom
  firstName: string;     // Prénom
  sex?: string;          // 'M' | 'F'
  birthDate?: string;    // date de naissance (facultatif)
  birthPlace?: string;   // Lieu de naissance
  className: string;     // Inscrit(e) en
  option?: string;
  gradeLevel?: string;   // facultatif → défaut = classe
  address?: string;      // Adresse
  fatherName?: string;   // Nom du père
  motherName?: string;   // Nom de la mère
  guardianName?: string; // Nom du responsable
  guardianRelation?: string; // Degré de parenté
  guardianPhone?: string;    // Téléphone du responsable
  provinceOrigin?: string;   // Province d'origine
  observation?: string;      // Observation
  enrolledAt?: string;       // Date d'inscription à l'école
  avatarUrl?: string;        // Photo de l'enfant
  documents?: StudentDocument[]; // Documents joints
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
  const birthDate = args.birthDate?.trim() || null;
  const enrolledAt = args.enrolledAt?.trim() || null;
  const fullName = [lastName, middleName, firstName].filter(Boolean).join(" ");
  const clean = (v?: string) => v?.trim() || null;
  const documents = (args.documents ?? [])
    .filter((d) => d && d.url)
    .map((d) => ({ name: (d.name || "Document").slice(0, 120), url: d.url }));

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

  // Cast : les nouvelles colonnes (fiche complète) sont ajoutées par la
  // migration 0062 ; les types Supabase générés ne les connaissent pas encore.
  const insertRow: Record<string, any> = {
    school_id: staff.school_id,
    full_name: fullName,
    first_name: firstName,
    middle_name: middleName,
    last_name: lastName,
    sex,
    birth_date: birthDate,
    birth_place: clean(args.birthPlace),
    class_name: className,
    grade_level: args.gradeLevel?.trim() || className,
    option: args.option?.trim() || null,
    address: clean(args.address),
    father_name: clean(args.fatherName),
    mother_name: clean(args.motherName),
    guardian_name: clean(args.guardianName),
    guardian_relation: clean(args.guardianRelation),
    guardian_phone: clean(args.guardianPhone),
    province_origin: clean(args.provinceOrigin),
    observation: clean(args.observation),
    enrolled_at: enrolledAt,
    avatar_url: clean(args.avatarUrl),
    documents,
    status: "active",
  };
  const { error } = await (supabase.from("students").insert as any)(insertRow);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/school/students");
  revalidatePath("/school/overview");
  revalidatePath("/school/student-attendance");
  return { ok: true };
}

// Supprime définitivement un élève. Grâce aux ON DELETE CASCADE, ses notes,
// présences, liens parents, etc. sont supprimés → il disparaît aussi de l'app
// des parents qui le suivaient.
export async function deleteStudentAction(studentId: string): Promise<Result> {
  if (!studentId) return { ok: false, message: "Élève invalide." };
  if (!isLiveMode()) return { ok: true };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Non authentifié" };

  const { data: staff } = await supabase
    .from("school_staff")
    .select("school_id")
    .eq("user_id", user.id)
    .eq("role", "school_admin")
    .maybeSingle();
  if (!staff) return { ok: false, message: "Réservé à la direction." };

  const { error } = await supabase.from("students").delete().eq("id", studentId).eq("school_id", staff.school_id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/school/students");
  revalidatePath("/school/overview");
  revalidatePath("/school/student-attendance");
  return { ok: true };
}
