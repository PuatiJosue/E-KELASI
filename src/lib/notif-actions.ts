"use server";

import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/env";

export type NotifPref = "all" | "important" | "none";

function clean(p: unknown): NotifPref {
  return p === "important" || p === "none" ? p : "all";
}

// Lit la préférence de notifications de l'utilisateur connecté.
export async function getNotifPrefAction(): Promise<NotifPref> {
  if (!isLiveMode()) return "all";
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "all";
  const { data } = await supabase.from("profiles").select("notif_pref").eq("id", user.id).maybeSingle();
  return clean((data as any)?.notif_pref);
}

// Enregistre la préférence (respectée par l'envoi des push via send-push).
export async function setNotifPrefAction(pref: NotifPref): Promise<{ ok: boolean }> {
  if (!isLiveMode()) return { ok: true };
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  const { error } = await supabase.from("profiles").update({ notif_pref: clean(pref) }).eq("id", user.id);
  return { ok: !error };
}
