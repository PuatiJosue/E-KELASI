"use server";

import { revalidatePath } from "next/cache";
import { serviceClient } from "@/lib/supabase/service";
import { isLiveMode } from "@/lib/env";
import { requireSchoolAdmin } from "@/lib/auth/guards";
import type { Result } from "@/lib/result";


const VALID = ["present", "absent", "late", "justified"];

export async function setAttendance(staffId: string, date: string, status: string, comment?: string): Promise<Result> {
  if (!staffId || !date || !VALID.includes(status)) return { ok: false, message: "Données invalides." };
  if (!isLiveMode()) return { ok: true };
  const c = await requireSchoolAdmin();
  if (!c) return { ok: false, message: "Action réservée à la direction." };
  const svc = serviceClient();
  const { error } = await svc.from("staff_attendance").upsert(
    {
      school_id: c.schoolId,
      staff_id: staffId,
      date,
      status,
      comment: comment?.trim() || null,
      recorded_by: c.userId,
    },
    { onConflict: "school_id,staff_id,date" }
  );
  if (error) return { ok: false, message: "Enregistrement impossible." };
  revalidatePath("/school/attendance");
  return { ok: true };
}

// Motif de la correction (congé, mission, retard justifié…). Le statut du jour
// doit déjà exister : le motif seul n'a pas de sens.
export async function setAttendanceComment(staffId: string, date: string, comment: string): Promise<Result> {
  if (!staffId || !date) return { ok: false, message: "Données invalides." };
  if (!isLiveMode()) return { ok: true };
  const c = await requireSchoolAdmin();
  if (!c) return { ok: false, message: "Action réservée à la direction." };
  const { error } = await serviceClient()
    .from("staff_attendance")
    .update({ comment: comment.trim() || null, recorded_by: c.userId })
    .eq("school_id", c.schoolId)
    .eq("staff_id", staffId)
    .eq("date", date);
  if (error) return { ok: false, message: "Enregistrement impossible." };
  revalidatePath("/school/attendance");
  return { ok: true };
}

// Annule un pointage erroné : l'agent redevient « non pointé » pour ce jour
// (il sort donc du calcul de régularité, contrairement à un statut « absent »).
export async function clearAttendance(staffId: string, date: string): Promise<Result> {
  if (!staffId || !date) return { ok: false, message: "Données invalides." };
  if (!isLiveMode()) return { ok: true };
  const c = await requireSchoolAdmin();
  if (!c) return { ok: false, message: "Action réservée à la direction." };
  const { error } = await serviceClient()
    .from("staff_attendance")
    .delete()
    .eq("school_id", c.schoolId)
    .eq("staff_id", staffId)
    .eq("date", date);
  if (error) return { ok: false, message: "Suppression impossible." };
  revalidatePath("/school/attendance");
  return { ok: true };
}
