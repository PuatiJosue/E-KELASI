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

export type TimetableRowInput = {
  day: number;
  startTime: string;
  endTime: string;
  subject: string;
  teacher?: string;
  room?: string;
};

// Enregistre (ou publie) l'emploi du temps complet d'une classe en une seule
// opération : on remplace tous les créneaux stockés de la classe par la grille
// fournie. `publish=false` → brouillon ; `publish=true` → visible aux parents.
export async function saveClassTimetable(input: {
  className: string;
  option?: string;
  rows: TimetableRowInput[];
  publish: boolean;
}): Promise<Result> {
  const className = input.className?.trim();
  if (!className) return { ok: false, message: "Classe requise." };
  const rows = input.rows ?? [];
  if (rows.length === 0) return { ok: false, message: "Ajoutez au moins une ligne." };
  for (const r of rows) {
    if (!(r.day >= 1 && r.day <= 7)) return { ok: false, message: "Jour invalide." };
    if (!r.startTime || !r.endTime) return { ok: false, message: "Heures de début et de fin requises." };
    if (r.endTime <= r.startTime) return { ok: false, message: "L'heure de fin doit être après l'heure de début." };
    if (!r.subject?.trim()) return { ok: false, message: "Matière requise pour chaque ligne." };
  }
  if (!isLiveMode()) return { ok: true };

  const c = await caller();
  if (!c) return { ok: false, message: "Réservé à la direction." };

  const svc = service();
  const { error: delErr } = await svc
    .from("timetable_slots")
    .delete()
    .eq("school_id", c.schoolId)
    .eq("class_name", className);
  if (delErr) return { ok: false, message: "Enregistrement impossible." };

  const payload = rows.map((r) => ({
    school_id: c.schoolId,
    class_name: className,
    option: input.option?.trim() || null,
    day: r.day,
    start_time: r.startTime,
    end_time: r.endTime,
    subject: r.subject.trim(),
    teacher: r.teacher?.trim() || null,
    room: r.room?.trim() || null,
    published: input.publish,
  }));
  const { error: insErr } = await svc.from("timetable_slots").insert(payload);
  if (insErr) return { ok: false, message: "Enregistrement impossible." };
  revalidatePath("/school/timetable");
  return { ok: true };
}

// Supprime tout l'emploi du temps d'une classe.
export async function deleteClassTimetable(className: string): Promise<Result> {
  const cls = className?.trim();
  if (!cls) return { ok: false, message: "Classe invalide." };
  if (!isLiveMode()) return { ok: true };
  const c = await caller();
  if (!c) return { ok: false, message: "Réservé à la direction." };
  const { error } = await service()
    .from("timetable_slots")
    .delete()
    .eq("school_id", c.schoolId)
    .eq("class_name", cls);
  if (error) return { ok: false, message: "Suppression impossible." };
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
