"use server";

import { revalidatePath } from "next/cache";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/db";
import { resolveOrCreateSubjectId } from "@/lib/subjects-db";
import { composeFullName } from "@/lib/staff-types";

type Result = { ok: true } | { ok: false; message: string };

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function callerSchoolId(): Promise<string | null> {
  const session = createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return null;
  const { data: staff } = await session
    .from("school_staff")
    .select("school_id")
    .eq("user_id", user.id)
    .eq("role", "school_admin")
    .maybeSingle();
  return staff?.school_id ?? null;
}

export type StaffInput = {
  fullName: string;
  lastName?: string;    // Nom
  middleName?: string;  // Post-nom
  firstName?: string;   // Prénom
  category: string;
  phone?: string;
  email?: string;
  qualifications?: string;
  hireDate?: string;
  status?: string;
  photoUrl?: string;
  address?: string;
  notes?: string;
};

// Cours attribués au prof : matière (libre/résolue) + classe + option + heures.
export type CourseInput = {
  subjectName: string;
  className: string;
  option?: string;
  weeklyHours?: number;
};

// Remplace les attributions de cours du membre par la liste fournie (ajout/retrait/édition).
async function syncCourses(svc: ReturnType<typeof service>, schoolId: string, staffId: string, courses: CourseInput[]) {
  await svc.from("course_assignments").delete().eq("school_id", schoolId).eq("staff_id", staffId);
  const valid = courses.filter((c) => c.subjectName?.trim() && c.className?.trim());
  for (const c of valid) {
    const subjectId = await resolveOrCreateSubjectId(schoolId, c.subjectName);
    if (!subjectId) continue;
    await svc.from("course_assignments").insert({
      school_id: schoolId,
      staff_id: staffId,
      subject_id: subjectId,
      class_name: c.className.trim(),
      option: c.option?.trim() || null,
      weekly_hours: c.weeklyHours && c.weeklyHours > 0 ? c.weeklyHours : 0,
    });
  }
}

function toRow(input: StaffInput) {
  // full_name dérivé des parties (Nom Post-nom Prénom) ; repli sur le champ libre.
  const fullName = composeFullName(input.lastName, input.middleName, input.firstName) || input.fullName.trim();
  return {
    full_name: fullName,
    last_name: input.lastName?.trim() || null,
    middle_name: input.middleName?.trim() || null,
    first_name: input.firstName?.trim() || null,
    category: input.category || "autre",
    phone: input.phone?.trim() || null,
    email: input.email?.trim() || null,
    qualifications: input.qualifications?.trim() || null,
    hire_date: input.hireDate || null,
    status: input.status || "active",
    photo_url: input.photoUrl || null,
    address: input.address?.trim() || null,
    notes: input.notes?.trim() || null,
  };
}

export async function createStaff(input: StaffInput, courses?: CourseInput[]): Promise<Result> {
  if (!input.fullName?.trim()) return { ok: false, message: "Le nom est requis." };
  if (!isLiveMode()) return { ok: true };
  const schoolId = await callerSchoolId();
  if (!schoolId) return { ok: false, message: "Action réservée à la direction." };
  const svc = service();
  const { data: created, error } = await svc
    .from("staff_members")
    .insert({ school_id: schoolId, ...toRow(input) })
    .select("id")
    .single();
  if (error || !created) return { ok: false, message: "Enregistrement impossible." };
  if (courses && courses.length > 0) await syncCourses(svc, schoolId, created.id, courses);
  revalidatePath("/school/staff");
  revalidatePath("/school/courses");
  revalidatePath("/school/classes");
  return { ok: true };
}

export async function updateStaff(id: string, input: StaffInput, courses?: CourseInput[]): Promise<Result> {
  if (!id) return { ok: false, message: "Fiche invalide." };
  if (!input.fullName?.trim()) return { ok: false, message: "Le nom est requis." };
  if (!isLiveMode()) return { ok: true };
  const schoolId = await callerSchoolId();
  if (!schoolId) return { ok: false, message: "Action réservée à la direction." };
  const svc = service();
  const { error } = await svc.from("staff_members").update(toRow(input)).eq("id", id).eq("school_id", schoolId);
  if (error) return { ok: false, message: "Mise à jour impossible." };
  if (courses) await syncCourses(svc, schoolId, id, courses);
  revalidatePath("/school/staff");
  revalidatePath("/school/courses");
  revalidatePath("/school/classes");
  return { ok: true };
}

export async function deleteStaff(id: string): Promise<Result> {
  if (!id) return { ok: false, message: "Fiche invalide." };
  if (!isLiveMode()) return { ok: true };
  const schoolId = await callerSchoolId();
  if (!schoolId) return { ok: false, message: "Action réservée à la direction." };
  const svc = service();
  const { error } = await svc.from("staff_members").delete().eq("id", id).eq("school_id", schoolId);
  if (error) return { ok: false, message: "Suppression impossible." };
  revalidatePath("/school/staff");
  return { ok: true };
}
