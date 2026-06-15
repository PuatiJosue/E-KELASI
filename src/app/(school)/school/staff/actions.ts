"use server";

import { revalidatePath } from "next/cache";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/db";

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

function toRow(input: StaffInput) {
  return {
    full_name: input.fullName.trim(),
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

export async function createStaff(input: StaffInput): Promise<Result> {
  if (!input.fullName?.trim()) return { ok: false, message: "Le nom est requis." };
  if (!isLiveMode()) return { ok: true };
  const schoolId = await callerSchoolId();
  if (!schoolId) return { ok: false, message: "Action réservée à la direction." };
  const svc = service();
  const { error } = await svc.from("staff_members").insert({ school_id: schoolId, ...toRow(input) });
  if (error) return { ok: false, message: "Enregistrement impossible." };
  revalidatePath("/school/staff");
  return { ok: true };
}

export async function updateStaff(id: string, input: StaffInput): Promise<Result> {
  if (!id) return { ok: false, message: "Fiche invalide." };
  if (!input.fullName?.trim()) return { ok: false, message: "Le nom est requis." };
  if (!isLiveMode()) return { ok: true };
  const schoolId = await callerSchoolId();
  if (!schoolId) return { ok: false, message: "Action réservée à la direction." };
  const svc = service();
  const { error } = await svc.from("staff_members").update(toRow(input)).eq("id", id).eq("school_id", schoolId);
  if (error) return { ok: false, message: "Mise à jour impossible." };
  revalidatePath("/school/staff");
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
