"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/db";

export type Recipient = { userId: string; fullName: string; role: string };

export async function listRecipientsAction(): Promise<Recipient[]> {
  if (!isLiveMode()) return [];
  try {
    const supabase = createClient();
    const { data, error } = await (supabase.rpc as any)("list_message_recipients");
    if (error) return [];
    return (data ?? []).map((r: any) => ({ userId: r.user_id, fullName: r.full_name ?? "?", role: r.role ?? "" }));
  } catch {
    return [];
  }
}

export async function startConversationAction(input: {
  otherUserId: string;
  subject: string;
  body: string;
}): Promise<{ ok: true; conversationId: string } | { ok: false; message: string }> {
  if (!input.otherUserId) return { ok: false, message: "Destinataire requis." };
  if (!input.body?.trim()) return { ok: false, message: "Message requis." };
  if (!isLiveMode()) return { ok: true, conversationId: "demo" };
  try {
    const supabase = createClient();
    const { data, error } = await (supabase.rpc as any)("start_conversation", {
      p_other: input.otherUserId,
      p_subject: input.subject ?? "",
      p_body: input.body.trim(),
    });
    if (error || !data) return { ok: false, message: "Envoi impossible." };
    revalidatePath("/teacher/messages");
    return { ok: true, conversationId: data as string };
  } catch {
    return { ok: false, message: "Envoi impossible." };
  }
}

export async function sendReplyAction(conversationId: string, body: string): Promise<{ ok: boolean; message?: string }> {
  if (!conversationId || !body?.trim()) return { ok: false, message: "Message requis." };
  if (!isLiveMode()) return { ok: true };
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, message: "Non authentifié." };
    const { error } = await supabase.from("messages").insert({ conversation_id: conversationId, sender_id: user.id, body: body.trim() });
    if (error) return { ok: false, message: "Envoi impossible." };
    await supabase.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", conversationId);
    revalidatePath(`/teacher/messages/${conversationId}`);
    revalidatePath("/teacher/messages");
    return { ok: true };
  } catch {
    return { ok: false, message: "Envoi impossible." };
  }
}
