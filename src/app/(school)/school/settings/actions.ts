"use server";

import { revalidatePath } from "next/cache";
import { serviceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/env";
import type { MessageResult as Result } from "@/lib/result";


// Signature électronique de la direction (nom + image).
export async function saveSignatureAction(input: { directorName: string; signatureUrl?: string }): Promise<Result> {
  if (!isLiveMode()) return { ok: true, message: "Enregistré (démo)." };
  const session = createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return { ok: false, message: "Non authentifié." };
  const { data: staff } = await session
    .from("school_staff")
    .select("school_id")
    .eq("user_id", user.id)
    .eq("role", "school_admin")
    .maybeSingle();
  if (!staff) return { ok: false, message: "Réservé à la direction." };

  const upd: Record<string, any> = { director_name: input.directorName?.trim() || null };
  if (input.signatureUrl !== undefined) upd.signature_url = input.signatureUrl || null;

  const svc = serviceClient();
  const { error } = await svc.from("schools").update(upd).eq("id", staff.school_id);
  if (error) return { ok: false, message: "Enregistrement impossible." };

  revalidatePath("/school/settings");
  revalidatePath("/school/reports");
  return { ok: true, message: "Signature enregistrée ✅" };
}
