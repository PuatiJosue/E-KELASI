// Flux de communications école → familles (mois en cours).

import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/env";

export type CommsFlow = { total: number; messages: number; bulletins: number; notes: number };

// Compteur global, toutes écoles confondues, des communications envoyées aux
// familles ce mois-ci : messages, bulletins/annonces (kind 'school') et notes.
export async function getCommsFlowThisMonth(): Promise<CommsFlow> {
  const empty: CommsFlow = { total: 0, messages: 0, bulletins: 0, notes: 0 };
  if (!isLiveMode()) return empty;
  try {
    const supabase = createClient();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const countKind = async (kind: string) => {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("kind", kind as any)
        .gte("created_at", monthStart);
      return count ?? 0;
    };
    const [messages, bulletins, notes] = await Promise.all([
      countKind("message"),
      countKind("school"),
      countKind("grade"),
    ]);
    return { total: messages + bulletins + notes, messages, bulletins, notes };
  } catch {
    return empty;
  }
}
