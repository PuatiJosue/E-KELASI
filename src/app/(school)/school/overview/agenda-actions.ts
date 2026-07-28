"use server";

import { revalidatePath } from "next/cache";
import { serviceClient } from "@/lib/supabase/service";
import { isLiveMode } from "@/lib/env";
import { requireSchoolAdmin } from "@/lib/auth/guards";
import type { Result } from "@/lib/result";


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

  const c = await requireSchoolAdmin();
  if (!c) return { ok: false, message: "Action réservée à la direction." };

  const svc = serviceClient();
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
  const c = await requireSchoolAdmin();
  if (!c) return { ok: false, message: "Action réservée à la direction." };
  const svc = serviceClient();
  const { error } = await svc.from("school_events").delete().eq("id", id).eq("school_id", c.schoolId);
  if (error) return { ok: false, message: "Suppression impossible." };
  revalidatePath("/school/overview");
  return { ok: true };
}
