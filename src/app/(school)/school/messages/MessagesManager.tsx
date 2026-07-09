"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import type { SchoolConversation } from "@/lib/messages-db";
import type { ReminderRecipient } from "@/lib/finance-db";
import { getSchoolThread, replyToConversation, sendPaymentReminders, type SchoolThread } from "./actions";

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

const money = (n: number, c = "CDF") => `${Math.round(n).toLocaleString("fr-FR")} ${c === "CDF" ? "FC" : c}`;

const DEFAULT_REMINDER =
  "Bonjour, nous vous rappelons que des frais scolaires restent à régler pour votre enfant. " +
  "Merci de bien vouloir vous rapprocher de la direction pour régulariser la situation. Cordialement, la direction.";

export function MessagesManager({
  conversations,
  reminderRecipients = [],
  startInReminder = false,
}: {
  conversations: SchoolConversation[];
  reminderRecipients?: ReminderRecipient[];
  startInReminder?: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [mode, setMode] = useState<"inbox" | "reminder">(startInReminder ? "reminder" : "inbox");
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
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Barre : bascule Messages ↔ Nouveau rappel */}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => setMode("inbox")}
          className={mode === "inbox" ? "ek-btn ek-btn-primary" : "ek-btn ek-btn-outline"}
          style={{ height: 36, fontSize: 12.5 }}
        >
          <Icon name="chat" size={14} /> <T fr="Messages" en="Messages" />
        </button>
        <button
          onClick={() => setMode("reminder")}
          className={mode === "reminder" ? "ek-btn ek-btn-primary" : "ek-btn ek-btn-outline"}
          style={{ height: 36, fontSize: 12.5 }}
        >
          <Icon name="bell" size={14} /> <T fr="Nouveau rappel" en="New reminder" />
        </button>
      </div>

      {mode === "reminder" ? (
        <ReminderComposer recipients={reminderRecipients} onSent={() => { setMode("inbox"); router.refresh(); }} />
      ) : (
        <div className="ek-card" style={{ padding: 0, overflow: "hidden", display: "grid", gridTemplateColumns: "300px 1fr", height: "calc(100vh - 240px)", minHeight: 440 }}>
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
      )}
    </div>
  );
}

// ── Composeur de rappel de paiement ──────────────────────────────────
function ReminderComposer({ recipients, onSent }: { recipients: ReminderRecipient[]; onSent: () => void }) {
  const [pending, start] = useTransition();
  // Pré-coche les élèves ayant un reste à payer (débiteurs).
  const [checked, setChecked] = useState<Set<string>>(() => new Set(recipients.filter((r) => r.remaining > 0).map((r) => r.studentId)));
  const [query, setQuery] = useState("");
  const [text, setText] = useState(DEFAULT_REMINDER);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const q = query.trim().toLowerCase();
  const shown = q
    ? recipients.filter((r) => r.studentName.toLowerCase().includes(q) || r.parentName.toLowerCase().includes(q) || r.className.toLowerCase().includes(q))
    : recipients;

  const toggle = (id: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  const shownAllOn = shown.length > 0 && shown.every((r) => checked.has(r.studentId));
  const toggleAll = () => setChecked((prev) => {
    const next = new Set(prev);
    if (shownAllOn) shown.forEach((r) => next.delete(r.studentId));
    else shown.forEach((r) => next.add(r.studentId));
    return next;
  });

  // Parents uniques correspondant aux élèves cochés.
  const selectedParents = [...new Set(recipients.filter((r) => checked.has(r.studentId)).map((r) => r.parentId))];

  const submit = () => {
    setMsg(null);
    if (selectedParents.length === 0) { setMsg({ ok: false, text: "Sélectionnez au moins un parent." }); return; }
    if (!text.trim()) { setMsg({ ok: false, text: "Message vide." }); return; }
    start(async () => {
      const res = await sendPaymentReminders(selectedParents, text.trim());
      if (res.ok) { setMsg({ ok: true, text: `Rappel envoyé à ${res.sent} parent(s).` }); setTimeout(onSent, 1200); }
      else setMsg({ ok: false, text: res.message });
    });
  };

  return (
    <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--divider)", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 160, fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>
          <T fr="Rappel de paiement" en="Payment reminder" /> — {selectedParents.length} <T fr="parent(s) sélectionné(s)" en="parent(s) selected" />
        </div>
        {recipients.length > 0 && (
          <button onClick={toggleAll} className="ek-btn ek-btn-outline" style={{ height: 30, fontSize: 11.5 }}>
            {shownAllOn ? <T fr="Tout décocher" en="Uncheck all" /> : <T fr="Tout cocher" en="Check all" />}
          </button>
        )}
      </div>

      {recipients.length === 0 ? (
        <div style={{ padding: 30, textAlign: "center", color: "var(--ink-3)", fontSize: 12.5 }}>
          <T fr="Aucun élève avec un parent enregistré." en="No student with a registered parent." />
        </div>
      ) : (
        <>
          {/* Barre de recherche : sélectionner les parents par leur enfant */}
          <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--divider)", position: "relative" }}>
            <span style={{ position: "absolute", left: 26, top: "50%", transform: "translateY(-50%)", color: "var(--ink-3)", display: "flex" }}><Icon name="search" size={15} /></span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un enfant, un parent, une classe…"
              style={{ width: "100%", padding: "9px 12px 9px 34px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)", fontSize: 13, color: "var(--ink)" }} />
          </div>
          <div style={{ maxHeight: 320, overflowY: "auto" }}>
            {shown.length === 0 ? (
              <div style={{ padding: 20, textAlign: "center", color: "var(--ink-3)", fontSize: 12.5 }}><T fr="Aucun résultat." en="No result." /></div>
            ) : shown.map((r, i) => (
              <label key={r.studentId} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderTop: i > 0 ? "1px solid var(--divider)" : "none", fontSize: 12.5, cursor: "pointer" }}>
                <input type="checkbox" checked={checked.has(r.studentId)} onChange={() => toggle(r.studentId)} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontWeight: 600, color: "var(--ink)" }}>{r.studentName}</span>
                  <span style={{ color: "var(--ink-3)" }}> · {r.className}</span>
                  <div style={{ fontSize: 11, color: "var(--ink-3)" }}>Parent : {r.parentName}{r.parentPhone ? ` · ${r.parentPhone}` : ""}</div>
                </div>
                {r.remaining > 0
                  ? <span style={{ color: "#E11D48", fontWeight: 700 }}>{money(r.remaining, r.currency)}</span>
                  : <span style={{ color: "#16A34A", fontWeight: 600, fontSize: 11 }}>À jour</span>}
              </label>
            ))}
          </div>

          <div style={{ padding: 16, borderTop: "1px solid var(--divider)", display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)" }}><T fr="Message de rappel" en="Reminder message" /></span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              style={{ width: "100%", resize: "vertical", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--ink)", fontSize: 13.5, outline: "none", fontFamily: "inherit" }}
            />
            {msg && <div style={{ fontSize: 12.5, fontWeight: 600, color: msg.ok ? "#16A34A" : "var(--danger)" }}>{msg.text}</div>}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={submit} disabled={pending || selectedParents.length === 0} className="ek-btn ek-btn-primary" style={{ height: 40, fontSize: 13, opacity: pending || selectedParents.length === 0 ? 0.6 : 1 }}>
                <Icon name="send" size={15} /> <T fr={`Envoyer aux ${selectedParents.length} sélectionné(s)`} en={`Send to ${selectedParents.length} selected`} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
