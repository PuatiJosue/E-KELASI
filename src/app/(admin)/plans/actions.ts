"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/env";
import type { Result } from "@/lib/result";

export type PlanId = "essentiel" | "famille" | "premium";


export async function updatePlanPricesAction(args: {
  essentiel: number; // cents
  famille: number;
  premium: number;
}): Promise<Result> {
  if (!isLiveMode()) return { ok: true };

  // Validation : entiers positifs raisonnables ($0.01 à $9 999,00)
  for (const [k, v] of Object.entries(args)) {
    if (!Number.isFinite(v) || v < 1 || v > 999900 || !Number.isInteger(v)) {
      return { ok: false, message: `Montant invalide pour ${k} (doit être en centimes, entier, 1–999900).` };
    }
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Non authentifié" };

  // RLS plan_prices_super_admin_write filtre déjà — on remonte juste l'erreur.
  const { error } = await supabase.from("plan_prices").upsert(
    [
      { plan: "essentiel" as PlanId, amount_cents: args.essentiel },
      { plan: "famille"   as PlanId, amount_cents: args.famille },
      { plan: "premium"   as PlanId, amount_cents: args.premium },
    ],
    { onConflict: "plan" }
  );

  if (error) {
    console.warn("[plans] update error:", error.message);
    return { ok: false, message: "Mise à jour refusée (droits insuffisants ?)" };
  }

  revalidatePath("/plans");
  return { ok: true };
}
