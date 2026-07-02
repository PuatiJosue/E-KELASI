"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import type { SchoolConversation } from "@/lib/messages-db";
import { getSchoolThread, replyToConversation, type SchoolThread } from "./actions";

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

export function MessagesManager({ conversations }: { conversations: SchoolConversation[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [thread, setThread] = useState<SchoolThread | null>(null);
  const [loading, setLoading] = useState(false);
  const [body, setBody] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const open = (id: string) => {
    setSelectedId(id);
    setThread(null);
    setErr(null);
    setLoading(true);
    getSchoolThread(id)
      .then((t) => {
        setThread(t);
        setLoading(false);
        // Recharge la liste (compteurs non-lus remis à zéro).
        router.refresh();
        setTimeout(() => endRef.current?.scrollIntoView({ behavior: "auto" }), 30);
      })
      .catch(() => setLoading(false));
  };

  const send = () => {
    if (!selectedId || !body.trim()) return;
    setErr(null);
    const text = body.trim();
    start(async () => {
      const res = await replyToConversation(selectedId, text);
      if (!res.ok) { setErr(res.message); return; }
      setBody("");
      const t = await getSchoolThread(selectedId);
      setThread(t);
      router.refresh();
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 30);
    });
  };

  return (
    <div className="ek-card" style={{ padding: 0, overflow: "hidden", display: "grid", gridTemplateColumns: "300px 1fr", height: "calc(100vh - 200px)", minHeight: 440 }}>
      {/* Liste des conversations */}
      <div style={{ borderRight: "1px solid var(--divider)", overflowY: "auto" }}>
        {conversations.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
            <T fr="Aucun message pour l'instant." en="No messages yet." />
          </div>
        ) : (
          conversations.map((c, i) => {
            const on = c.id === selectedId;
            return (
              <button
                key={c.id}
                onClick={() => open(c.id)}
                style={{
                  width: "100%", textAlign: "left", border: "none", cursor: "pointer",
                  background: on ? "var(--surface-2)" : "transparent",
                  borderTop: i > 0 ? "1px solid var(--divider)" : "none",
                  borderLeft: on ? "3px solid var(--brand)" : "3px solid transparent",
                  padding: "12px 14px", display: "flex", gap: 10, alignItems: "flex-start",
                }}
              >
                <div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--grad-brand)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                  {initials(c.parentName)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.parentName}</div>
                    <div style={{ marginLeft: "auto", fontSize: 10.5, color: "var(--ink-3)", flexShrink: 0 }}>{c.time}</div>
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.subject}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                    <div style={{ flex: 1, fontSize: 12, color: c.unread > 0 ? "var(--ink)" : "var(--ink-3)", fontWeight: c.unread > 0 ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.preview}</div>
                    {c.unread > 0 && <span style={{ minWidth: 18, height: 18, borderRadius: 9, background: "var(--brand)", color: "white", fontSize: 10.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px" }}>{c.unread}</span>}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Fil de discussion */}
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        {!selectedId ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, color: "var(--ink-3)" }}>
            <Icon name="chat" size={34} />
            <div style={{ fontSize: 13 }}><T fr="Sélectionnez une conversation." en="Select a conversation." /></div>
          </div>
        ) : (
          <>
            <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--divider)" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>{thread?.parentName ?? "…"}</div>
              {thread?.subject && <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{thread.subject}</div>}
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: 18, display: "flex", flexDirection: "column", gap: 10, background: "var(--surface-2)" }}>
              {loading ? (
                <div style={{ margin: "auto", color: "var(--ink-3)", fontSize: 13 }}><T fr="Chargement…" en="Loading…" /></div>
              ) : (
                (thread?.messages ?? []).map((m) => (
                  <div key={m.id} style={{ alignSelf: m.fromSchool ? "flex-end" : "flex-start", maxWidth: "78%" }}>
                    <div style={{ padding: "9px 13px", borderRadius: 13, fontSize: 13.5, lineHeight: 1.4, background: m.fromSchool ? "var(--brand)" : "var(--surface)", color: m.fromSchool ? "white" : "var(--ink)", border: m.fromSchool ? "none" : "1px solid var(--border)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                      {m.body}
                    </div>
                    <div style={{ fontSize: 10.5, color: "var(--ink-4)", marginTop: 3, textAlign: m.fromSchool ? "right" : "left" }}>{m.createdAt}</div>
                  </div>
                ))
              )}
              <div ref={endRef} />
            </div>

            {err && <div style={{ padding: "6px 18px", fontSize: 12.5, color: "var(--danger)", fontWeight: 600 }}>{err}</div>}

            <div style={{ padding: 12, borderTop: "1px solid var(--divider)", display: "flex", gap: 8, alignItems: "flex-end" }}>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Votre réponse…"
                rows={1}
                style={{ flex: 1, resize: "none", minHeight: 40, maxHeight: 120, padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--ink)", fontSize: 13.5, outline: "none", fontFamily: "inherit" }}
              />
              <button onClick={send} disabled={pending || !body.trim()} className="ek-btn ek-btn-primary" style={{ height: 40, fontSize: 13, opacity: pending || !body.trim() ? 0.6 : 1 }}>
                <Icon name="send" size={15} /> <T fr="Envoyer" en="Send" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
