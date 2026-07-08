"use server";

import { revalidatePath } from "next/cache";
import { caller, service } from "@/lib/messages-db";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/db";

export type SchoolThreadMessage = { id: string; body: string; fromSchool: boolean; createdAt: string };
export type SchoolThread = {
  conversationId: string;
  subject: string;
  parentName: string;
  messages: SchoolThreadMessage[];
};

type Result = { ok: true } | { ok: false; message: string };

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

// Charge tous les messages d'une conversation de l'école et marque comme lus
// ceux envoyés par le parent.
export async function getSchoolThread(conversationId: string): Promise<SchoolThread | null> {
  if (!conversationId) return null;
  if (!isLiveMode()) return null;
  const c = await caller();
  if (!c) return null;
  const svc = service();

  const { data: conv } = await svc
    .from("conversations")
    .select("id, subject, school_id")
    .eq("id", conversationId)
    .maybeSingle();
  if (!conv || (conv as any).school_id !== c.schoolId) return null;

  // Personnel de l'école (pour distinguer les messages « direction »).
  const { data: staffRows } = await svc.from("school_staff").select("user_id").eq("school_id", c.schoolId);
  const staffIds = new Set((staffRows ?? []).map((r: any) => r.user_id));

  // Participant parent (pour le titre).
  const { data: parts } = await svc.from("conversation_participants").select("user_id").eq("conversation_id", conversationId);
  const parentId = (parts ?? []).map((p: any) => p.user_id).find((id: string) => !staffIds.has(id)) ?? null;
  let parentName = "Parent";
  if (parentId) {
    const { data: prof } = await svc.from("profiles").select("full_name").eq("id", parentId).maybeSingle();
    parentName = (prof as any)?.full_name || "Parent";
  }

  const { data: msgs } = await svc
    .from("messages")
    .select("id, body, sender_id, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  // Marque lus les messages du parent.
  if (parentId) {
    await svc
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("sender_id", parentId)
      .is("read_at", null);
  }

  revalidatePath("/school/messages");
  return {
    conversationId,
    subject: (conv as any).subject,
    parentName,
    messages: (msgs ?? []).map((m: any) => ({
      id: m.id,
      body: m.body,
      fromSchool: staffIds.has(m.sender_id),
      createdAt: fmtTime(m.created_at),
    })),
  };
}

// Envoie un rappel de paiement à une sélection de parents (point 3).
// Utilise la RPC start_conversation (SECURITY DEFINER, migration 0053) via le
// client de SESSION pour que auth.uid() = directeur : la RPC réutilise ou crée
// la conversation 1:1 puis insère le message (qui notifie le parent, trigger 0058).
export async function sendPaymentReminders(
  parentIds: string[],
  body: string
): Promise<{ ok: true; sent: number } | { ok: false; message: string }> {
  const text = body?.trim();
  if (!text) return { ok: false, message: "Message vide." };
  const ids = [...new Set((parentIds ?? []).filter(Boolean))];
  if (ids.length === 0) return { ok: false, message: "Aucun parent sélectionné." };
  if (!isLiveMode()) return { ok: true, sent: ids.length };

  const c = await caller();
  if (!c) return { ok: false, message: "Réservé à la direction." };

  const session = createClient();
  let sent = 0;
  for (const pid of ids) {
    const { error } = await (session.rpc as any)("start_conversation", {
      p_other: pid,
      p_subject: "Rappel de paiement",
      p_body: text,
    });
    if (!error) sent++;
  }
  if (sent === 0) return { ok: false, message: "Envoi impossible." };

  revalidatePath("/school/messages");
  return { ok: true, sent };
}

// Répond dans une conversation (en tant que direction).
export async function replyToConversation(conversationId: string, body: string): Promise<Result> {
  if (!conversationId || !body?.trim()) return { ok: false, message: "Message vide." };
  if (!isLiveMode()) return { ok: true };
  const c = await caller();
  if (!c) return { ok: false, message: "Réservé à la direction." };
  const svc = service();

  const { data: conv } = await svc.from("conversations").select("id, school_id").eq("id", conversationId).maybeSingle();
  if (!conv || (conv as any).school_id !== c.schoolId) return { ok: false, message: "Conversation introuvable." };

  // S'assure que le directeur est participant (pour les futures lectures RLS mobiles).
  const { data: already } = await svc
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", c.userId)
    .maybeSingle();
  if (!already) {
    await svc.from("conversation_participants").insert({ conversation_id: conversationId, user_id: c.userId });
  }

  const { error } = await svc.from("messages").insert({ conversation_id: conversationId, sender_id: c.userId, body: body.trim() });
  if (error) return { ok: false, message: "Envoi impossible." };
  await svc.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", conversationId);

  revalidatePath("/school/messages");
  return { ok: true };
}
