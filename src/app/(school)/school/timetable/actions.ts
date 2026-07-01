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

export async function addTimetableSlot(input: {
  className: string;
  option?: string;
  day: number;
  startTime: string;
  endTime: string;
  subject: string;
  teacher?: string;
  room?: string;
}): Promise<Result> {
  if (!input.className?.trim() || !input.subject?.trim() || !input.startTime || !input.endTime) {
    return { ok: false, message: "Classe, matière et horaires requis." };
  }
  if (!(input.day >= 1 && input.day <= 7)) return { ok: false, message: "Jour invalide." };
  if (!isLiveMode()) return { ok: true };

  const c = await caller();
  if (!c) return { ok: false, message: "Réservé à la direction." };

  const { error } = await service().from("timetable_slots").insert({
    school_id: c.schoolId,
    class_name: input.className.trim(),
    option: input.option?.trim() || null,
    day: input.day,
    start_time: input.startTime,
    end_time: input.endTime,
    subject: input.subject.trim(),
    teacher: input.teacher?.trim() || null,
    room: input.room?.trim() || null,
  });
  if (error) return { ok: false, message: "Enregistrement impossible." };
  revalidatePath("/school/timetable");
  return { ok: true };
}

// Publie (ou repasse en brouillon) tous les créneaux d'une classe.
export async function publishClassTimetable(className: string, publish: boolean): Promise<Result> {
  if (!className?.trim()) return { ok: false, message: "Classe invalide." };
  if (!isLiveMode()) return { ok: true };
  const c = await caller();
  if (!c) return { ok: false, message: "Réservé à la direction." };
  const { error } = await service()
    .from("timetable_slots")
    .update({ published: publish })
    .eq("school_id", c.schoolId)
    .eq("class_name", className.trim());
  if (error) return { ok: false, message: "Mise à jour impossible." };
  revalidatePath("/school/timetable");
  return { ok: true };
}

export async function deleteTimetableSlot(id: string): Promise<Result> {
  if (!id) return { ok: false, message: "Créneau invalide." };
  if (!isLiveMode()) return { ok: true };
  const c = await caller();
  if (!c) return { ok: false, message: "Réservé à la direction." };
  const { error } = await service().from("timetable_slots").delete().eq("id", id).eq("school_id", c.schoolId);
  if (error) return { ok: false, message: "Suppression impossible." };
  revalidatePath("/school/timetable");
  return { ok: true };
}
