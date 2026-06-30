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

async function caller(): Promise<{ userId: string; schoolId: string } | null> {
  const session = createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return null;
  const { data: staff } = await session
    .from("school_staff")
    .select("school_id")
    .eq("user_id", user.id)
    .eq("role", "school_admin")
    .maybeSingle();
  if (!staff?.school_id) return null;
  return { userId: user.id, schoolId: staff.school_id };
}

export async function createSchoolEvent(input: {
  title: string;
  location?: string;
  startsAt: string; // ISO ou « datetime-local »
}): Promise<Result> {
  const title = input.title?.trim();
  if (!title) return { ok: false, message: "Titre requis." };
  const when = input.startsAt ? new Date(input.startsAt) : null;
  if (!when || isNaN(when.getTime())) return { ok: false, message: "Date invalide." };
  if (!isLiveMode()) return { ok: true };

  const c = await caller();
  if (!c) return { ok: false, message: "Action réservée à la direction." };

  const svc = service();
  const { error } = await svc.from("school_events").insert({
    school_id: c.schoolId,
    title,
    location: input.location?.trim() || null,
    starts_at: when.toISOString(),
    created_by: c.userId,
  });
  if (error) return { ok: false, message: "Enregistrement impossible." };

  revalidatePath("/school/overview");
  return { ok: true };
}

export async function deleteSchoolEvent(id: string): Promise<Result> {
  if (!id) return { ok: false, message: "Événement invalide." };
  if (!isLiveMode()) return { ok: true };
  const c = await caller();
  if (!c) return { ok: false, message: "Action réservée à la direction." };
  const svc = service();
  const { error } = await svc.from("school_events").delete().eq("id", id).eq("school_id", c.schoolId);
  if (error) return { ok: false, message: "Suppression impossible." };
  revalidatePath("/school/overview");
  return { ok: true };
}
