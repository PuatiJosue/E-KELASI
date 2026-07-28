// Tableau de bord « Écoles partenaires » (console admin).

import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/env";

export type AdminSchoolRow = {
  id: string;
  name: string;
  city: string;
  students: number;
  parents: number;     // parents connectés (distincts)
  messages: number;    // messages reçus par les familles ce mois
  documents: number;   // documents partagés (annonces + fiches)
  status: string;
};
export type RecentDoc = { name: string; url: string | null; schoolName: string; dateFr: string; kind: "fiche" | "annonce" };
export type SchoolsAdminOverview = {
  kpis: {
    activeSchools: number;
    totalSchools: number;
    totalStudents: number;
    connectedParents: number;
    parentsActivePct: number;
    messagesThisMonth: number;
    documentsShared: number;
    bugs: number;
  };
  schools: AdminSchoolRow[];
  distribution: { id: string; name: string; students: number }[];
  dailyActivity: number[];
  recentDocuments: RecentDoc[];
};

export async function getSchoolsAdminOverview(): Promise<SchoolsAdminOverview> {
  const empty: SchoolsAdminOverview = {
    kpis: { activeSchools: 0, totalSchools: 0, totalStudents: 0, connectedParents: 0, parentsActivePct: 0, messagesThisMonth: 0, documentsShared: 0, bugs: 0 },
    schools: [],
    distribution: [],
    dailyActivity: [],
    recentDocuments: [],
  };
  if (!isLiveMode()) return empty;
  try {
    const supabase = createClient();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    const [{ data: schools }, { data: students }, { data: links }, { data: docs }, { data: anns }, { data: notifs }, { count: bugs }] =
      await Promise.all([
        supabase.from("schools").select("id, name, city, status").order("name"),
        supabase.from("students").select("id, school_id").eq("status", "active"),
        supabase.from("parent_links").select("parent_id, access_status, students(school_id)"),
        (supabase as any).from("school_documents").select("school_id, name, url, created_at"),
        (supabase as any).from("announcements").select("school_id, attachment_url, attachment_name, title, created_at"),
        supabase.from("notifications").select("user_id, kind, created_at").gte("created_at", monthStart.toISOString()),
        supabase.from("support_tickets").select("*", { count: "exact", head: true }),
      ]);

    const schoolList = schools ?? [];
    const schoolName = new Map<string, string>(schoolList.map((s: any) => [s.id, s.name]));

    // Élèves par école.
    const studentsBySchool = new Map<string, number>();
    for (const s of students ?? []) {
      if (s.school_id) studentsBySchool.set(s.school_id, (studentsBySchool.get(s.school_id) ?? 0) + 1);
    }

    // Parents connectés (distincts) par école + mapping parent → écoles.
    const parentsBySchool = new Map<string, Set<string>>();
    const activeParents = new Set<string>();
    const allParents = new Set<string>();
    const parentSchools = new Map<string, Set<string>>();
    for (const l of links ?? []) {
      const sid = (l as any).students?.school_id;
      const pid = (l as any).parent_id;
      if (!sid || !pid) continue;
      allParents.add(pid);
      if ((l as any).access_status !== "blocked") activeParents.add(pid);
      if (!parentsBySchool.has(sid)) parentsBySchool.set(sid, new Set());
      parentsBySchool.get(sid)!.add(pid);
      if (!parentSchools.has(pid)) parentSchools.set(pid, new Set());
      parentSchools.get(pid)!.add(sid);
    }

    // Documents partagés par école (annonces avec pièce jointe + fiches école).
    const docsBySchool = new Map<string, number>();
    for (const d of docs ?? []) {
      const sid = (d as any).school_id;
      if (sid) docsBySchool.set(sid, (docsBySchool.get(sid) ?? 0) + 1);
    }
    for (const a of anns ?? []) {
      if ((a as any).attachment_url && (a as any).school_id) {
        const sid = (a as any).school_id;
        docsBySchool.set(sid, (docsBySchool.get(sid) ?? 0) + 1);
      }
    }

    // Messages reçus ce mois par école (via l'école du parent destinataire) + activité quotidienne.
    const messagesBySchool = new Map<string, number>();
    const dailyActivity = new Array(daysInMonth).fill(0);
    let messagesThisMonth = 0;
    for (const n of notifs ?? []) {
      const created = new Date((n as any).created_at);
      const day = created.getDate() - 1;
      if (day >= 0 && day < daysInMonth) dailyActivity[day] += 1;
      if ((n as any).kind === "message") {
        messagesThisMonth += 1;
        const schoolsOfParent = parentSchools.get((n as any).user_id);
        if (schoolsOfParent) for (const sid of schoolsOfParent) messagesBySchool.set(sid, (messagesBySchool.get(sid) ?? 0) + 1);
      }
    }

    const rows: AdminSchoolRow[] = schoolList.map((s) => ({
      id: s.id,
      name: s.name,
      city: s.city,
      students: studentsBySchool.get(s.id) ?? 0,
      parents: parentsBySchool.get(s.id)?.size ?? 0,
      messages: messagesBySchool.get(s.id) ?? 0,
      documents: docsBySchool.get(s.id) ?? 0,
      status: s.status,
    }));

    const totalStudents = [...studentsBySchool.values()].reduce((a, b) => a + b, 0);
    const documentsShared = [...docsBySchool.values()].reduce((a, b) => a + b, 0);

    // Derniers documents partagés (fiches école + pièces jointes d'annonces).
    const fmtDocDate = (d: string) => {
      const dt = new Date(d);
      return isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
    };
    const recentDocuments: RecentDoc[] = [
      ...(docs ?? []).map((d: any) => ({
        name: d.name ?? "Document",
        url: d.url ?? null,
        schoolName: schoolName.get(d.school_id) ?? "—",
        date: d.created_at as string,
        dateFr: fmtDocDate(d.created_at),
        kind: "fiche" as const,
      })),
      ...(anns ?? [])
        .filter((a: any) => a.attachment_url)
        .map((a: any) => ({
          name: a.attachment_name ?? a.title ?? "Pièce jointe",
          url: a.attachment_url as string,
          schoolName: schoolName.get(a.school_id) ?? "—",
          date: a.created_at as string,
          dateFr: fmtDocDate(a.created_at),
          kind: "annonce" as const,
        })),
    ]
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
      .slice(0, 6)
      .map(({ date: _date, ...rest }) => rest);

    return {
      kpis: {
        activeSchools: schoolList.filter((s) => s.status === "active").length,
        totalSchools: schoolList.length,
        totalStudents,
        connectedParents: allParents.size,
        parentsActivePct: allParents.size > 0 ? Math.round((activeParents.size / allParents.size) * 100) : 0,
        messagesThisMonth,
        documentsShared,
        bugs: bugs ?? 0,
      },
      schools: rows,
      distribution: rows
        .filter((r) => r.students > 0)
        .sort((a, b) => b.students - a.students)
        .map((r) => ({ id: r.id, name: r.name, students: r.students })),
      dailyActivity,
      recentDocuments,
    };
  } catch {
    return empty;
  }
}
