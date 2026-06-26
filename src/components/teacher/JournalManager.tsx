"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { T, useLang } from "@/lib/i18n";
import { addJournalEntry, deleteJournalEntry, type JournalEntry } from "@/app/(teacher)/teacher/journal/actions";

export function JournalManager({ entries }: { entries: JournalEntry[] }) {
  const router = useRouter();
  const lang = useLang();
  const frEn = (fr: string, en: string) => (lang === "en" ? en : fr);
  const [pending, startTransition] = useTransition();

  const today = new Date().toISOString().slice(0, 10);
  const [entryDate, setEntryDate] = useState(today);
  const [subject, setSubject] = useState("");
  const [className, setClassName] = useState("");
  const [lesson, setLesson] = useState("");
  const [summary, setSummary] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.subject.toLowerCase().includes(q) ||
        e.className.toLowerCase().includes(q) ||
        e.lesson.toLowerCase().includes(q) ||
        e.dateFr.includes(q)
    );
  }, [entries, search]);

  const save = () => {
    setError(null);
    startTransition(async () => {
      const r = await addJournalEntry({ entryDate, subject, className, lesson, summary });
      if (r.ok) {
        setSubject(""); setClassName(""); setLesson(""); setSummary("");
        router.refresh();
      } else {
        setError(r.message);
      }
    });
  };

  const remove = (id: string) => {
    startTransition(async () => {
      const r = await deleteJournalEntry(id);
      if (r.ok) router.refresh();
    });
  };

  const esc = (s: unknown) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

  const exportPdf = () => {
    const body = filtered
      .map(
        (e) =>
          `<tr><td>${esc(e.dateFr)}</td><td>${esc(e.subject || "—")}</td><td>${esc(e.className || "—")}</td><td>${esc(e.lesson)}</td><td>${esc(e.summary || "—")}</td></tr>`
      )
      .join("");
    const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Journal de bord</title>
<style>*{font-family:Arial,Helvetica,sans-serif;box-sizing:border-box}body{margin:32px;color:#1a1a2e}
h1{font-size:18px;margin:0 0 2px}.sub{color:#666;font-size:12px;margin-bottom:18px}
table{width:100%;border-collapse:collapse;font-size:11px}
th{background:#1f3a8a;color:#fff;text-align:left;padding:7px 8px;text-transform:uppercase;font-size:9.5px}
td{padding:7px 8px;border-bottom:1px solid #e5e7eb;vertical-align:top}</style></head><body>
<h1>Journal de bord</h1>
<div class="sub">${filtered.length} entrée(s)</div>
<table><thead><tr><th>Date</th><th>Matière</th><th>Classe</th><th>Leçon</th><th>Résumé</th></tr></thead>
<tbody>${body}</tbody></table>
<script>window.onload=function(){window.print()}</script></body></html>`;
    const w = window.open("", "_blank");
    if (!w) {
      alert("Autorisez les fenêtres pop-up pour générer le PDF.");
      return;
    }
    w.document.write(html);
    w.document.close();
  };

  return (
    <>
      {/* Formulaire de saisie du jour */}
      <div className="ek-card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>
          <T fr="Nouvelle entrée" en="New entry" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }} className="ek-stack-md">
          <Field label={<T fr="Date" en="Date" />}>
            <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} style={inp} />
          </Field>
          <Field label={<T fr="Matière" en="Subject" />}>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={frEn("ex. Mathématiques", "e.g. Maths")} style={inp} />
          </Field>
          <Field label={<T fr="Classe" en="Class" />}>
            <input value={className} onChange={(e) => setClassName(e.target.value)} placeholder={frEn("ex. 1ère Scientifique", "e.g. Grade 10")} style={inp} />
          </Field>
        </div>
        <Field label={<T fr="Leçon donnée" en="Lesson taught" />}>
          <input value={lesson} onChange={(e) => setLesson(e.target.value)} placeholder={frEn("Titre de la leçon…", "Lesson title…")} style={inp} />
        </Field>
        <Field label={<T fr="Petit résumé" en="Short summary" />}>
          <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} placeholder={frEn("Points clés abordés, exercices…", "Key points, exercises…")} style={{ ...inp, resize: "vertical" }} />
        </Field>
        {error && (
          <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(192,58,43,0.1)", color: "var(--danger)", fontSize: 12, fontWeight: 600 }}>{error}</div>
        )}
        <div>
          <button onClick={save} disabled={pending || !lesson.trim()} className="ek-btn ek-btn-primary" style={{ height: 38, fontSize: 12.5, opacity: pending || !lesson.trim() ? 0.6 : 1 }}>
            <Icon name="check" size={14} />
            {pending ? <T fr="Enregistrement…" en="Saving…" /> : <T fr="Enregistrer l'entrée" en="Save entry" />}
          </button>
        </div>
      </div>

      {/* Historique */}
      <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--divider)", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>
            <T fr="Mon journal" en="My logbook" />
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={frEn("Rechercher (matière, classe, leçon, date)…", "Search…")}
            style={{ ...inp, maxWidth: 280 }}
          />
          <button
            onClick={exportPdf}
            disabled={filtered.length === 0}
            className="ek-btn ek-btn-outline"
            style={{ height: 36, fontSize: 12, marginLeft: "auto", opacity: filtered.length === 0 ? 0.5 : 1 }}
          >
            <Icon name="file" size={13} /> PDF
          </button>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: 36, textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
            <T fr="Aucune entrée pour l'instant." en="No entry yet." />
          </div>
        ) : (
          filtered.map((e, i) => (
            <div key={e.id} style={{ padding: "14px 18px", borderTop: i > 0 ? "1px solid var(--divider)" : "none", display: "flex", gap: 14 }}>
              <div style={{ minWidth: 92, fontSize: 12.5, color: "var(--ink-2)", fontFamily: "var(--font-display)", fontWeight: 600 }}>
                {e.dateFr}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  {e.subject && <span className="ek-chip brand">{e.subject}</span>}
                  {e.className && <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{e.className}</span>}
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)", marginTop: 4 }}>{e.lesson}</div>
                {e.summary && <div style={{ fontSize: 12.5, color: "var(--ink-2)", marginTop: 3, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{e.summary}</div>}
              </div>
              <button onClick={() => remove(e.id)} disabled={pending} title="Supprimer" style={{ color: "var(--danger)", background: "none", border: "none", cursor: "pointer", alignSelf: "flex-start" }}>
                <Icon name="trash" size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </>
  );
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</span>
      {children}
    </label>
  );
}

const inp: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid var(--border-strong)",
  background: "var(--surface)",
  color: "var(--ink)",
  fontSize: 13,
  fontFamily: "inherit",
  width: "100%",
};
