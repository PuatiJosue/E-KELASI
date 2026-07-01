import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/db";
import { Reply } from "./Reply";

async function loadThread(conversationId: string) {
  if (!isLiveMode()) return null;
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const [{ data: conv }, { data: parts }, { data: msgs }] = await Promise.all([
      supabase.from("conversations").select("subject").eq("id", conversationId).maybeSingle(),
      supabase.from("conversation_participants").select("user_id, profiles(full_name)").eq("conversation_id", conversationId),
      supabase.from("messages").select("id, body, sender_id, created_at").eq("conversation_id", conversationId).order("created_at", { ascending: true }),
    ]);
    const other = (parts ?? []).find((p: any) => p.user_id !== user.id) as any;
    return {
      subject: (conv as any)?.subject ?? "",
      otherName: other?.profiles?.full_name ?? "Conversation",
      messages: (msgs ?? []).map((m: any) => ({ id: m.id, body: m.body, fromMe: m.sender_id === user.id, at: new Date(m.created_at).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) })),
    };
  } catch {
    return null;
  }
}

export default async function TeacherThread({ params }: { params: { id: string } }) {
  const thread = await loadThread(params.id);

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14, height: "100%", maxHeight: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link href="/teacher/messages" className="ek-btn ek-btn-outline" style={{ height: 34, width: 34, padding: 0 }}>
          <Icon name="chevL" size={16} />
        </Link>
        <Avatar name={thread?.otherName ?? "?"} size={38} />
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-display)" }}>{thread?.otherName ?? "Conversation"}</div>
          {thread?.subject && <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{thread.subject}</div>}
        </div>
      </div>

      <div className="ek-card" style={{ flex: 1, padding: 16, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
        {!thread || thread.messages.length === 0 ? (
          <div style={{ margin: "auto", color: "var(--ink-3)", fontSize: 13 }}>Aucun message.</div>
        ) : (
          thread.messages.map((m) => (
            <div key={m.id} style={{ alignSelf: m.fromMe ? "flex-end" : "flex-start", maxWidth: "78%" }}>
              <div style={{ padding: "9px 13px", borderRadius: 14, background: m.fromMe ? "var(--brand)" : "var(--surface-2)", color: m.fromMe ? "#fff" : "var(--ink)", fontSize: 13.5, lineHeight: 1.4 }}>
                {m.body}
              </div>
              <div style={{ fontSize: 10.5, color: "var(--ink-3)", marginTop: 3, textAlign: m.fromMe ? "right" : "left" }}>{m.at}</div>
            </div>
          ))
        )}
      </div>

      <Reply conversationId={params.id} />
    </div>
  );
}
