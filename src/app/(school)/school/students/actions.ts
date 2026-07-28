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
/** Rubrique libre définie par l'école (intitulé + valeur). */
export type StudentExtraField = { label: string; value: string };

export type StudentFormValues = {
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
  bloodGroup?: string;            // Groupe sanguin
  allergies?: string;             // Allergies connues
  medicalNotes?: string;          // Maladie chronique / traitement
  emergencyContactName?: string;  // Personne à prévenir
  emergencyContactPhone?: string; // Téléphone d'urgence
  previousSchool?: string;   // École fréquentée avant
  previousClass?: string;    // Dernière classe suivie
  observation?: string;      // Observation
  enrolledAt?: string;       // Date d'inscription à l'école
  avatarUrl?: string;        // Photo de l'enfant (absent = inchangée)
  documents?: StudentDocument[]; // Documents joints
  extraFields?: StudentExtraField[]; // Rubriques personnalisées
};

const clean = (v?: string) => v?.trim() || null;

// Nettoie les rubriques libres : intitulé obligatoire, longueurs bornées.
function normalizeExtraFields(fields?: StudentExtraField[]): StudentExtraField[] {
  return (fields ?? [])
    .map((f) => ({ label: (f?.label ?? "").trim().slice(0, 60), value: (f?.value ?? "").trim().slice(0, 500) }))
    .filter((f) => f.label)
    .slice(0, 30);
}

function normalizeDocuments(documents?: StudentDocument[]): StudentDocument[] {
  return (documents ?? [])
    .filter((d) => d && d.url)
    .map((d) => ({ name: (d.name || "Document").slice(0, 120), url: d.url }));
}

// Colonnes communes ajout/modification, dérivées du formulaire.
function studentColumns(args: StudentFormValues): Record<string, any> {
  return {
    sex: args.sex === "M" || args.sex === "F" ? args.sex : null,
    birth_date: args.birthDate?.trim() || null,
    birth_place: clean(args.birthPlace),
    class_name: args.className.trim(),
    grade_level: args.gradeLevel?.trim() || args.className.trim(),
    option: args.option?.trim() || null,
    address: clean(args.address),
    father_name: clean(args.fatherName),
    mother_name: clean(args.motherName),
    guardian_name: clean(args.guardianName),
    guardian_relation: clean(args.guardianRelation),
    guardian_phone: clean(args.guardianPhone),
    province_origin: clean(args.provinceOrigin),
    blood_group: clean(args.bloodGroup),
    allergies: clean(args.allergies),
    medical_notes: clean(args.medicalNotes),
    emergency_contact_name: clean(args.emergencyContactName),
    emergency_contact_phone: clean(args.emergencyContactPhone),
    previous_school: clean(args.previousSchool),
    previous_class: clean(args.previousClass),
    observation: clean(args.observation),
    enrolled_at: args.enrolledAt?.trim() || null,
    documents: normalizeDocuments(args.documents),
    extra_fields: normalizeExtraFields(args.extraFields),
  };
}

export async function addStudentAction(args: StudentFormValues): Promise<Result> {
  if (!isLiveMode()) return { ok: true };
  const lastName = args.lastName?.trim();
  const firstName = args.firstName?.trim();
  const middleName = args.middleName?.trim() || null;
  const className = args.className?.trim();
  if (!lastName || !firstName || !className) {
    return { ok: false, message: "Nom, prénom et classe sont requis." };
  }
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

  // Cast : les nouvelles colonnes (fiche complète, migrations 0062 et 0073) ne
  // sont pas encore connues des types Supabase générés.
  const insertRow: Record<string, any> = {
    ...studentColumns(args),
    school_id: staff.school_id,
    full_name: fullName,
    first_name: firstName,
    middle_name: middleName,
    last_name: lastName,
    avatar_url: clean(args.avatarUrl),
    status: "active",
  };
  const { error } = await (supabase.from("students").insert as any)(insertRow);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/school/students");
  revalidatePath("/school/overview");
  revalidatePath("/school/student-attendance");
  return { ok: true };
}

// Modification d'une fiche existante. Mêmes champs que l'ajout ; la photo n'est
// remplacée que si une nouvelle a été envoyée (avatarUrl absent = inchangée).
export async function updateStudentAction(
  args: StudentFormValues & { studentId: string }
): Promise<Result> {
  if (!args.studentId) return { ok: false, message: "Élève invalide." };
  if (!isLiveMode()) return { ok: true };

  const lastName = args.lastName?.trim();
  const firstName = args.firstName?.trim();
  const middleName = args.middleName?.trim() || null;
  const className = args.className?.trim();
  if (!lastName || !firstName || !className) {
    return { ok: false, message: "Nom, prénom et classe sont requis." };
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

  const updateRow: Record<string, any> = {
    ...studentColumns(args),
    full_name: [lastName, middleName, firstName].filter(Boolean).join(" "),
    first_name: firstName,
    middle_name: middleName,
    last_name: lastName,
  };
  const newAvatar = clean(args.avatarUrl);
  if (newAvatar) updateRow.avatar_url = newAvatar;

  const { error } = await (supabase.from("students").update as any)(updateRow)
    .eq("id", args.studentId)
    .eq("school_id", staff.school_id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/school/students");
  revalidatePath(`/school/students/${args.studentId}`);
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
