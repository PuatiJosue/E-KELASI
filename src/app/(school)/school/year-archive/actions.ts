"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/db";

type Result =
  | { ok: true; gradesArchived: number; homeworkArchived: number }
  | { ok: false; message: string };

/**
 * Commence une nouvelle année scolaire : archive (sans supprimer) toutes les
 * notes et devoirs de l'école enregistrés jusqu'ici. Réservé à la direction.
 */
export async function archiveSchoolYearAction(args: { confirm: string }): Promise<Result> {
  // Double-confirmation : l'utilisateur doit taper la phrase magique.
  if ((args.confirm ?? "").trim().toUpperCase() !== "ARCHIVER") {
    return { ok: false, message: 'Tape "ARCHIVER" pour confirmer.' };
  }

  if (!isLiveMode()) return { ok: true, gradesArchived: 0, homeworkArchived: 0 };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Non authentifié." };

  const { data: staff } = await supabase
    .from("school_staff")
    .select("school_id")
    .eq("user_id", user.id)
    .eq("role", "school_admin")
    .maybeSingle();
  if (!staff?.school_id) return { ok: false, message: "Réservé à la direction." };

  // RPC security-definer : vérifie côté DB que l'appelant est bien la direction
  // de cette école (my_admin_school_ids()).
  // Cast : la fonction est ajoutée par la migration 0061 ; les types Supabase
  // générés ne la connaissent pas encore tant qu'ils n'ont pas été régénérés.
  const { data, error } = await (supabase.rpc as any)("archive_school_year", { p_school_id: staff.school_id });
  if (error) {
    console.warn("[school-year-archive] rpc error:", error.message);
    return { ok: false, message: "Archivage refusé (droits insuffisants ?)." };
  }

  const row = Array.isArray(data) ? data[0] : data;
  const gradesArchived = (row as any)?.grades_count ?? 0;
  const homeworkArchived = (row as any)?.homework_count ?? 0;

  revalidatePath("/school/year-archive");
  revalidatePath("/school/overview");
  revalidatePath("/school/reports");
  return { ok: true, gradesArchived, homeworkArchived };
}
