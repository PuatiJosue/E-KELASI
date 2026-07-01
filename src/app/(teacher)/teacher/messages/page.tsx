import Link from "next/link";
import { PageHeader } from "@/components/KPI";
import { Avatar } from "@/components/Avatar";
import { T } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/db";
import { NewConversation } from "./NewConversation";

async function listTeacherThreads() {
  if (!isLiveMode()) return [];
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: convs } = await supabase
      .from("conversations")
      .select("id, subject, last_message_at, conversation_participants!inner(user_id)")
      .eq("conversation_participants.user_id", user.id)
      .order("last_message_at", { ascending: false });
    if (!convs) return [];

    const threads = await Promise.all(
      convs.map(async (c: any) => {
        const { data: msg } = await supabase
          .from("messages")
          .select("body, sender_id, profiles(full_name)")
          .eq("conversation_id", c.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        // Trouve l'autre participant (le parent)
        const { data: parts } = await supabase
          .from("conversation_participants")
          .select("user_id, profiles(full_name)")
          .eq("conversation_id", c.id);
        const other = (parts ?? []).find((p: any) => p.user_id !== user.id) as any;
        return {
          id: c.id,
          from: other?.profiles?.full_name ?? "?",
          subject: c.subject,
          preview: (msg as any)?.body ?? "",
          time: new Date(c.last_message_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
          unread: msg && (msg as any).sender_id !== user.id,
        };
      })
    );
    return threads;
  } catch {
    return [];
  }
}

export default async function TeacherMessages() {
  const threads = await listTeacherThreads();

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={{ fr: "Messagerie parents", en: "Parent inbox" }}
        sub={{
          fr: `${threads.length} conversations`,
          en: `${threads.length} conversations`,
        }}
        right={<NewConversation />}
      />

      <div className="ek-card" style={{ padding: 0 }}>
        {threads.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--ink-3)", fontSize: 12 }}>
            <T fr="Aucune conversation pour l'instant." en="No conversations yet." />
          </div>
        ) : (
          threads.map((th, i) => (
            <Link
              key={th.id}
              href={`/teacher/messages/${th.id}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 18px",
                borderBottom: i < threads.length - 1 ? "1px solid var(--divider)" : "none",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <Avatar name={th.from} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>{th.from}</span>
                  <span style={{ fontSize: 11, color: "var(--ink-3)" }}>· {th.subject}</span>
                  <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--ink-3)" }}>{th.time}</span>
                </div>
                <div
                  style={{
                    fontSize: 12.5,
                    color: th.unread ? "var(--ink)" : "var(--ink-3)",
                    fontWeight: th.unread ? 600 : 400,
                    marginTop: 2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {th.preview}
                </div>
              </div>
              {th.unread && <div style={{ width: 8, height: 8, borderRadius: 4, background: "var(--brand)" }} />}
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
