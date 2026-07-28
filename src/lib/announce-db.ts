// Couche données — annonces de l'école (Lot C). Lecture via service role
// (table hors types générés ; scope école via getMySchool).

import { serviceClient } from "@/lib/supabase/service";
import { getMySchool } from "@/lib/school/profile";
import { isLiveMode } from "@/lib/env";

export type Announcement = {
  id: string;
  title: string;
  body: string;
  eventDate: string | null;
  createdAt: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
};

export type ActivityItem = {
  id: string;
  icon: string;
  tint: "blue" | "violet" | "green" | "amber" | "rose" | "teal";
  fr: string;
  en: string;
  at: string;
  rel: string;
};

/** Temps relatif compact en français : « à l'instant », « il y a 2 h », « hier »… */
function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.round(h / 24);
  if (d === 1) return "hier";
  if (d < 7) return `il y a ${d} j`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

/** Flux d'activité récente de l'école (notes saisies, devoirs, annonces). */
export async function getSchoolActivity(limit = 6): Promise<ActivityItem[]> {
  if (!isLiveMode()) return [];
  try {
    const school = await getMySchool();
    if (!school) return [];
    const svc = serviceClient();

    const [grades, homework, announces] = await Promise.all([
      svc
        .from("grades")
        .select("id, created_at, teacher:teacher_id(full_name), subjects!inner(name, school_id)")
        .eq("subjects.school_id", school.id)
        .order("created_at", { ascending: false })
        .limit(20),
      svc
        .from("homework")
        .select("id, title, created_at, teacher:teacher_id(full_name), subjects!inner(name, school_id)")
        .eq("subjects.school_id", school.id)
        .order("created_at", { ascending: false })
        .limit(6),
      svc
        .from("announcements")
        .select("id, title, created_at")
        .eq("school_id", school.id)
        .order("created_at", { ascending: false })
        .limit(6),
    ]);

    const items: ActivityItem[] = [];

    // Notes : regroupées par (prof, matière, jour) avec un compteur.
    const groups = new Map<string, { count: number; at: string; who: string; subject: string }>();
    for (const g of (grades.data ?? []) as any[]) {
      const who = g.teacher?.full_name ?? "Un enseignant";
      const subject = g.subjects?.name ?? "—";
      const day = (g.created_at ?? "").slice(0, 10);
      const key = `${who}|${subject}|${day}`;
      const cur = groups.get(key);
      if (cur) cur.count += 1;
      else groups.set(key, { count: 1, at: g.created_at, who, subject });
    }
    for (const grp of groups.values()) {
      items.push({
        id: `g-${grp.who}-${grp.subject}-${grp.at}`,
        icon: "clipboard",
        tint: "blue",
        fr: `${grp.who} a saisi ${grp.count} note${grp.count > 1 ? "s" : ""} en ${grp.subject}`,
        en: `${grp.who} entered ${grp.count} grade${grp.count > 1 ? "s" : ""} in ${grp.subject}`,
        at: grp.at,
        rel: relTime(grp.at),
      });
    }

    for (const h of (homework.data ?? []) as any[]) {
      const who = h.teacher?.full_name ?? "Un enseignant";
      items.push({
        id: `h-${h.id}`,
        icon: "bookOpen",
        tint: "rose",
        fr: `${who} a créé un devoir « ${h.title} »`,
        en: `${who} created homework “${h.title}”`,
        at: h.created_at,
        rel: relTime(h.created_at),
      });
    }

    for (const a of (announces.data ?? []) as any[]) {
      items.push({
        id: `a-${a.id}`,
        icon: "bell",
        tint: "violet",
        fr: `Annonce publiée : « ${a.title} »`,
        en: `Announcement posted: “${a.title}”`,
        at: a.created_at,
        rel: relTime(a.created_at),
      });
    }

    return items
      .sort((x, y) => new Date(y.at).getTime() - new Date(x.at).getTime())
      .slice(0, limit);
  } catch {
    return [];
  }
}

export async function listSchoolAnnouncements(): Promise<Announcement[]> {
  if (!isLiveMode()) return [];
  try {
    const school = await getMySchool();
    if (!school) return [];
    const svc = serviceClient();
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
