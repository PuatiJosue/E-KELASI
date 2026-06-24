// Couche données — annonces de l'école (Lot C). Lecture via service role
// (table hors types générés ; scope école via getMySchool).

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

export type Announcement = {
  id: string;
  title: string;
  body: string;
  eventDate: string | null;
  createdAt: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
};

export async function listSchoolAnnouncements(): Promise<Announcement[]> {
  if (!isLiveMode()) return [];
  try {
    const school = await getMySchool();
    if (!school) return [];
    const svc = service();
    const { data } = await svc
      .from("announcements")
      .select("id, title, body, event_date, created_at, attachment_url, attachment_name")
      .eq("school_id", school.id)
      .order("created_at", { ascending: false });
    return (data ?? []).map((a: any) => ({
      id: a.id,
      title: a.title,
      body: a.body,
      eventDate: a.event_date,
      createdAt: a.created_at,
      attachmentUrl: a.attachment_url ?? null,
      attachmentName: a.attachment_name ?? null,
    }));
  } catch {
    return [];
  }
}
