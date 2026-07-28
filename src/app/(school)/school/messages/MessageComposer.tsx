"use client";

import { useMemo, useState, useTransition } from "react";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import { sendSchoolMessage } from "./actions";
import { initials } from "./shared";
import type { ReminderRecipient } from "@/lib/finance/reminders";

// ── Composeur de message libre (un parent, une classe, ou tous) ───────
type ParentEntry = { id: string; name: string; phone: string | null; classes: string[] };

export function MessageComposer({ recipients, onSent }: { recipients: ReminderRecipient[]; onSent: () => void }) {
  const [pending, start] = useTransition();
  const [classFilter, setClassFilter] = useState(""); // "" = toutes les classes
  const [query, setQuery] = useState("");
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [text, setText] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Parents uniques (dédupliqués par parentId) avec les classes de leurs enfants.
  const parents = useMemo<ParentEntry[]>(() => {
    const m = new Map<string, ParentEntry>();
    for (const r of recipients) {
      const e = m.get(r.parentId) ?? { id: r.parentId, name: r.parentName, phone: r.parentPhone, classes: [] };
      if (!e.classes.includes(r.className)) e.classes.push(r.className);
      m.set(r.parentId, e);
    }
    return [...m.values()].sort((a, b) => a.name.localeCompare(b.name, "fr"));
  }, [recipients]);

  const classes = useMemo(
    () => [...new Set(recipients.map((r) => r.className))].sort((a, b) => a.localeCompare(b, "fr", { numeric: true })),
    [recipients]
  );

  const q = query.trim().toLowerCase();
  const shown = parents.filter((p) => {
    if (classFilter && !p.classes.includes(classFilter)) return false;
    if (q && !p.name.toLowerCase().includes(q)) return false;
    return true;
  });

  const toggle = (id: string) =>
    setChecked((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const shownAllOn = shown.length > 0 && shown.every((p) => checked.has(p.id));
  const toggleAll = () => setChecked((prev) => {
    const next = new Set(prev);
    if (shownAllOn) shown.forEach((p) => next.delete(p.id));
    else shown.forEach((p) => next.add(p.id));
    return next;
  });

  const submit = () => {
    setMsg(null);
    const ids = [...checked];
    if (ids.length === 0) { setMsg({ ok: false, text: "Sélectionnez au moins un parent." }); return; }
    if (!text.trim()) { setMsg({ ok: false, text: "Message vide." }); return; }
    start(async () => {
      const res = await sendSchoolMessage(ids, text.trim());
      if (res.ok) { setMsg({ ok: true, text: `Message envoyé à ${res.sent} parent(s).` }); setTimeout(onSent, 1200); }
      else setMsg({ ok: false, text: res.message });
    });
  };

  return (
    <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--divider)", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 160, fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>
          <T fr="Nouveau message" en="New message" /> — {checked.size} <T fr="parent(s) sélectionné(s)" en="parent(s) selected" />
        </div>
        {shown.length > 0 && (
          <button onClick={toggleAll} className="ek-btn ek-btn-outline" style={{ height: 30, fontSize: 11.5 }}>
            {shownAllOn ? <T fr="Tout décocher" en="Uncheck all" /> : <T fr="Tout cocher" en="Check all" />}
          </button>
        )}
      </div>

      {parents.length === 0 ? (
        <div style={{ padding: 30, textAlign: "center", color: "var(--ink-3)", fontSize: 12.5 }}>
          <T fr="Aucun parent enregistré." en="No registered parent." />
        </div>
      ) : (
        <>
          {/* Filtre classe + recherche */}
          <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--divider)", display: "flex", gap: 8, flexWrap: "wrap" }}>
            <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}
              style={{ height: 38, padding: "0 10px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)", fontSize: 13, color: "var(--ink)" }}>
              <option value="">🏫 Toutes les classes</option>
              {classes.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un parent…"
              style={{ flex: 1, minWidth: 160, padding: "9px 12px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)", fontSize: 13, color: "var(--ink)" }} />
          </div>
          <div style={{ maxHeight: 320, overflowY: "auto" }}>
            {shown.length === 0 ? (
              <div style={{ padding: 20, textAlign: "center", color: "var(--ink-3)", fontSize: 12.5 }}><T fr="Aucun résultat." en="No result." /></div>
            ) : shown.map((p, i) => (
              <label key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderTop: i > 0 ? "1px solid var(--divider)" : "none", fontSize: 12.5, cursor: "pointer" }}>
                <input type="checkbox" checked={checked.has(p.id)} onChange={() => toggle(p.id)} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontWeight: 600, color: "var(--ink)" }}>{p.name}</span>
                  {p.phone ? <span style={{ color: "var(--ink-3)" }}> · {p.phone}</span> : null}
                  <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{p.classes.join(", ")}</div>
                </div>
              </label>
            ))}
          </div>

          <div style={{ padding: 16, borderTop: "1px solid var(--divider)", display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)" }}><T fr="Votre message" en="Your message" /></span>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder="Écrivez votre message aux parents…"
              style={{ width: "100%", resize: "vertical", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--ink)", fontSize: 13.5, outline: "none", fontFamily: "inherit" }} />
            {msg && <div style={{ fontSize: 12.5, fontWeight: 600, color: msg.ok ? "#16A34A" : "var(--danger)" }}>{msg.text}</div>}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={submit} disabled={pending || checked.size === 0} className="ek-btn ek-btn-primary" style={{ height: 40, fontSize: 13, opacity: pending || checked.size === 0 ? 0.6 : 1 }}>
                <Icon name="send" size={15} /> <T fr={`Envoyer à ${checked.size} parent(s)`} en={`Send to ${checked.size} parent(s)`} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

