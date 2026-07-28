"use client";

import { useMemo, useState, useTransition } from "react";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import { sendPaymentReminders } from "./actions";
import { initials, money, DEFAULT_REMINDER } from "./shared";
import type { ReminderRecipient } from "@/lib/finance/reminders";

// ── Composeur de rappel de paiement ──────────────────────────────────
export function ReminderComposer({ recipients, onSent }: { recipients: ReminderRecipient[]; onSent: () => void }) {
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

