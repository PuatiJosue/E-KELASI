"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/db";

type Result =
  | { ok: true; gradesArchived: number; homeworkArchived: number }
  | { ok: false; message: string };

export async function archiveYearAction(args: { cutoff: string; confirm: string }): Promise<Result> {
  if (!isLiveMode()) {
    return { ok: true, gradesArchived: 0, homeworkArchived: 0 };
  }

  // Double-confirmation : l'utilisateur doit taper la phrase magique.
  if (args.confirm !== "ARCHIVER") {
    return { ok: false, message: 'Tape "ARCHIVER" pour confirmer.' };
  }

  // Date attendue ISO (YYYY-MM-DD ou ISO complet)
  const cutoff = new Date(args.cutoff);
  if (isNaN(cutoff.getTime())) {
    return { ok: false, message: "Date de coupure invalide." };
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Non authentifié" };

  // RPC : archive_year(cutoff) — vérifie is_super_admin() côté DB.
  const { data, error } = await supabase.rpc("archive_year", { cutoff: cutoff.toISOString() });
  if (error) {
    console.warn("[year-archive] rpc error:", error.message);
    return { ok: false, message: "Archivage refusé (droits insuffisants ?)" };
  }

  const row = Array.isArray(data) ? data[0] : null;
  const gradesArchived = row?.grades_count ?? 0;
  const homeworkArchived = row?.homework_count ?? 0;

  revalidatePath("/year-archive");
  return { ok: true, gradesArchived, homeworkArchived };
}
