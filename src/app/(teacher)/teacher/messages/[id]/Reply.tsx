"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { sendReplyAction } from "../actions";

export function Reply({ conversationId }: { conversationId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [body, setBody] = useState("");

  const send = () => {
    const text = body.trim();
    if (!text) return;
    start(async () => {
      const res = await sendReplyAction(conversationId, text);
      if (res.ok) { setBody(""); router.refresh(); }
    });
  };

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Votre réponse…"
        rows={1}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
        style={{ flex: 1, minHeight: 44, maxHeight: 120, padding: "11px 13px", borderRadius: 12, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--ink)", fontSize: 13.5, outline: "none", resize: "vertical", fontFamily: "var(--font-body)" }}
      />
      <button onClick={send} disabled={pending || !body.trim()} className="ek-btn ek-btn-primary" style={{ height: 44, width: 48, padding: 0, opacity: pending || !body.trim() ? 0.6 : 1 }}>
        <Icon name="send" size={17} />
      </button>
    </div>
  );
}
