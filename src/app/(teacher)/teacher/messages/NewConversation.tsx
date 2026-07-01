"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { Avatar } from "@/components/Avatar";
import { T } from "@/lib/i18n";
import { listRecipientsAction, startConversationAction, type Recipient } from "./actions";

const roleLabel = (r: string) => (r === "parent" ? "Parent" : r === "teacher" ? "Enseignant" : r === "school_admin" ? "Direction" : r);

const input: React.CSSProperties = {
  width: "100%", height: 38, padding: "0 11px", borderRadius: 9, border: "1px solid var(--border-strong)",
  background: "var(--surface)", color: "var(--ink)", fontSize: 13, outline: "none",
};

export function NewConversation() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [recipients, setRecipients] = useState<Recipient[] | null>(null);
  const [sel, setSel] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open && recipients === null) listRecipientsAction().then(setRecipients).catch(() => setRecipients([]));
  }, [open, recipients]);

  const submit = () => {
    setErr(null);
    if (!sel) { setErr("Choisissez un destinataire."); return; }
    if (!body.trim()) { setErr("Écrivez un message."); return; }
    start(async () => {
      const res = await startConversationAction({ otherUserId: sel, subject, body });
      if (!res.ok) { setErr(res.message); return; }
      setOpen(false); setSel(""); setSubject(""); setBody("");
      router.push(`/teacher/messages/${res.conversationId}`);
    });
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="ek-btn ek-btn-primary" style={{ height: 38, fontSize: 13 }}>
        <Icon name="plus" size={15} stroke={2.5} /> <T fr="Nouveau message" en="New message" />
      </button>

      {open && (
        <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(20,16,10,0.45)", display: "grid", placeItems: "center", zIndex: 100, padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} className="ek-card" style={{ width: "100%", maxWidth: 480, padding: 22, maxHeight: "88vh", overflowY: "auto" }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--ink)", marginBottom: 14, fontFamily: "var(--font-display)" }}>
              <T fr="Nouveau message" en="New message" />
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)", marginBottom: 6 }}><T fr="Destinataire" en="Recipient" /></div>
                {recipients === null ? (
                  <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>…</div>
                ) : recipients.length === 0 ? (
                  <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}><T fr="Aucun parent disponible." en="No parent available." /></div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 220, overflowY: "auto" }}>
                    {recipients.map((r) => {
                      const on = sel === r.userId;
                      return (
                        <button key={r.userId} type="button" onClick={() => setSel(r.userId)} style={{ display: "flex", alignItems: "center", gap: 10, padding: 8, borderRadius: 10, cursor: "pointer", border: `1.5px solid ${on ? "var(--brand)" : "var(--border)"}`, background: on ? "var(--brand-soft)" : "var(--surface)", textAlign: "left" }}>
                          <Avatar name={r.fullName} size={32} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{r.fullName}</div>
                            <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{roleLabel(r.role)}</div>
                          </div>
                          {on && <Icon name="check" size={16} color="var(--brand)" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Sujet (facultatif)" style={input} />
              <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Votre message…" rows={4} style={{ ...input, height: "auto", padding: 11, resize: "vertical", fontFamily: "var(--font-body)" }} />
            </div>

            {err && <div style={{ marginTop: 10, fontSize: 12.5, color: "var(--danger)", fontWeight: 600 }}>{err}</div>}

            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button onClick={() => setOpen(false)} className="ek-btn ek-btn-outline" style={{ flex: 1 }}><T fr="Annuler" en="Cancel" /></button>
              <button onClick={submit} disabled={pending} className="ek-btn ek-btn-primary" style={{ flex: 1, opacity: pending ? 0.6 : 1 }}>
                {pending ? "…" : <T fr="Envoyer" en="Send" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
