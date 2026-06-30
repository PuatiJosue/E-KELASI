// Couche données — agenda de la direction (événements internes affichés sur la
// vue d'ensemble « Aujourd'hui »). Lecture via service_role, scope école.

import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getMySchool } from "@/lib/school-db";
import { isLiveMode } from "@/lib/db";

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export type SchoolEvent = {
  id: string;
  title: string;
  location: string | null;
  startsAt: string;
  time: string;     // « 08:00 »
  dayLabel: string; // « Aujourd'hui » / « 3 juil. »
  isToday: boolean;
};

/** Événements à venir (à partir d'aujourd'hui 00h), triés par heure. */
export async function listUpcomingEvents(limit = 6): Promise<SchoolEvent[]> {
  if (!isLiveMode()) return [];
  try {
    const school = await getMySchool();
    if (!school) return [];
    const svc = service();
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const { data } = await svc
      .from("school_events")
      .select("id, title, location, starts_at")
      .eq("school_id", school.id)
      .gte("starts_at", start.toISOString())
      .order("starts_at", { ascending: true })
      .limit(limit);

    const todayStr = new Date().toDateString();
    return (data ?? []).map((e: any) => {
      const d = new Date(e.starts_at);
      const isToday = d.toDateString() === todayStr;
      return {
        id: e.id,
        title: e.title,
        location: e.location ?? null,
        startsAt: e.starts_at,
        time: d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        dayLabel: isToday ? "Aujourd'hui" : d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
        isToday,
      };
    });
  } catch {
    return [];
  }
}
