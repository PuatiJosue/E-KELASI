// Messagerie côté console école : lecture des conversations parent ↔ direction.
// Service role, scope école via le personnel (school_admin) de l'appelant.

import { serviceClient } from "@/lib/supabase/service";
import { isLiveMode } from "@/lib/env";
import { requireSchoolAdmin } from "@/lib/auth/guards";

// Heure courte « 14:05 » si aujourd'hui, sinon « 3 juil. ».
function fmtWhen(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export type SchoolConversation = {
  id: string;
  subject: string;
  parentId: string | null;
  parentName: string;
  preview: string;
  time: string;
  unread: number;
};

export async function listSchoolConversations(): Promise<SchoolConversation[]> {
  if (!isLiveMode()) return [];
  const c = await requireSchoolAdmin();
  if (!c) return [];
  const svc = serviceClient();

  const { data: convs } = await svc
    .from("conversations")
    .select("id, subject, last_message_at")
    .eq("school_id", c.schoolId)
    .order("last_message_at", { ascending: false })
    .limit(100);
  if (!convs || convs.length === 0) return [];

  const convIds = convs.map((x: any) => x.id);

  // Personnel de l'école → sert à distinguer « parent » de « direction ».
  const { data: staffRows } = await svc.from("school_staff").select("user_id").eq("school_id", c.schoolId);
  const staffIds = new Set((staffRows ?? []).map((r: any) => r.user_id));

  // Participant « parent » de chaque conversation (celui qui n'est pas du personnel).
  const { data: parts } = await svc
    .from("conversation_participants")
    .select("conversation_id, user_id")
    .in("conversation_id", convIds);
  const parentByConv = new Map<string, string>();
  for (const p of (parts ?? []) as any[]) {
    if (!staffIds.has(p.user_id) && !parentByConv.has(p.conversation_id)) {
      parentByConv.set(p.conversation_id, p.user_id);
    }
  }

  const parentIds = [...new Set(parentByConv.values())];
  const { data: profs } = parentIds.length
    ? await svc.from("profiles").select("id, full_name").in("id", parentIds)
    : { data: [] as any[] };
  const nameById = new Map((profs ?? []).map((p: any) => [p.id, p.full_name]));

  const result: SchoolConversation[] = [];
  for (const cv of convs as any[]) {
    const parentId = parentByConv.get(cv.id) ?? null;

    const { data: last } = await svc
      .from("messages")
      .select("body, created_at")
      .eq("conversation_id", cv.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let unread = 0;
    if (parentId) {
      const { count } = await svc
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", cv.id)
        .eq("sender_id", parentId)
        .is("read_at", null);
      unread = count ?? 0;
    }

    const body = (last as any)?.body ?? "";
    result.push({
      id: cv.id,
      subject: cv.subject,
      parentId,
      parentName: (parentId && nameById.get(parentId)) || "Parent",
      preview: body.length > 90 ? body.slice(0, 87) + "…" : body,
      time: fmtWhen(cv.last_message_at),
      unread,
    });
  }
  return result;
}

// Nombre total de messages non lus (parents) — pour le badge du menu.
export async function getUnreadMessageCount(): Promise<number> {
  if (!isLiveMode()) return 0;
  try {
    const c = await requireSchoolAdmin();
    if (!c) return 0;
    const svc = serviceClient();
    const { data: convs } = await svc.from("conversations").select("id").eq("school_id", c.schoolId);
    const ids = (convs ?? []).map((x: any) => x.id);
    if (ids.length === 0) return 0;
    const { data: staffRows } = await svc.from("school_staff").select("user_id").eq("school_id", c.schoolId);
    const staffIds = (staffRows ?? []).map((r: any) => r.user_id);
    let q = svc
      .from("messages")
      .select("id", { count: "exact", head: true })
      .in("conversation_id", ids)
      .is("read_at", null);
    if (staffIds.length) q = q.not("sender_id", "in", `(${staffIds.join(",")})`);
    const { count } = await q;
    return count ?? 0;
  } catch {
    return 0;
  }
}
