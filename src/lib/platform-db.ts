// Couche données — annonces plateforme (super-admin E-KLASS). Service role.

import { createClient as createServiceClient } from "@supabase/supabase-js";
import { isLiveMode } from "@/lib/db";

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export type PlatformAnnouncement = {
  id: string;
  title: string;
  body: string;
  audience: string;
  createdAt: string;
};

function map(d: any): PlatformAnnouncement {
  return { id: d.id, title: d.title, body: d.body, audience: d.audience, createdAt: d.created_at };
}

// Toutes les annonces (console super-admin).
export async function listPlatformAnnouncements(): Promise<PlatformAnnouncement[]> {
  if (!isLiveMode()) return [];
  try {
    const svc = service();
    const { data } = await svc
      .from("platform_announcements")
      .select("id, title, body, audience, created_at")
      .order("created_at", { ascending: false });
    return (data ?? []).map(map);
  } catch {
    return [];
  }
}

// Annonces destinées aux écoles (bannière console direction).
export async function getPlatformForSchools(): Promise<PlatformAnnouncement[]> {
  if (!isLiveMode()) return [];
  try {
    const svc = service();
    const { data } = await svc
      .from("platform_announcements")
      .select("id, title, body, audience, created_at")
      .in("audience", ["all", "schools"])
      .order("created_at", { ascending: false })
      .limit(3);
    return (data ?? []).map(map);
  } catch {
    return [];
  }
}
