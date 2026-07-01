"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import type { TimetableSlot } from "@/lib/content-db";
import { addTimetableSlot, deleteTimetableSlot, publishClassTimetable } from "./actions";

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

function escapeHtml(s: string) {
  return (s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

// Trie les créneaux par jour puis heure de début.
const byDayTime = (a: TimetableSlot, b: TimetableSlot) => a.day - b.day || a.startTime.localeCompare(b.startTime);

const input: React.CSSProperties = {
  height: 38, padding: "0 11px", borderRadius: 9, border: "1px solid var(--border-strong)",
  background: "var(--surface)", color: "var(--ink)", fontSize: 13, outline: "none", width: "100%",
};

export function TimetableManager({ slots, classNames }: { slots: TimetableSlot[]; classNames: string[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [className, setClassName] = useState("");
  const [day, setDay] = useState(1);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("09:40");
  const [subject, setSubject] = useState("");
  const [teacher, setTeacher] = useState("");
  const [room, setRoom] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const submit = () => {
    setErr(null);
    start(async () => {
      const res = await addTimetableSlot({ className, day, startTime, endTime, subject, teacher, room });
      if (!res.ok) { setErr(res.message); return; }
      setSubject(""); setTeacher(""); setRoom("");
      router.refresh();
    });
  };

  const remove = (id: string) => start(async () => { await deleteTimetableSlot(id); router.refresh(); });

  const publish = (cls: string, value: boolean) => start(async () => {
    const res = await publishClassTimetable(cls, value);
    if (!res.ok) { alert(res.message); return; }
    router.refresh();
  });

  // Export Excel (CSV) d'une classe.
  const exportExcel = (cls: string, list: TimetableSlot[]) => {
    const header = ["Jour", "Début", "Fin", "Matière", "Enseignant", "Salle"];
    const lines = [header, ...list.slice().sort(byDayTime).map((s) => [DAYS[s.day - 1], s.startTime, s.endTime, s.subject, s.teacher ?? "", s.room ?? ""])];
    const csv = lines.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `emploi-du-temps-${cls.replace(/\s+/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export PDF (impression) d'une classe.
  const exportPdf = (cls: string, list: TimetableSlot[]) => {
    const rows = list.slice().sort(byDayTime)
      .map((s) => `<tr><td>${escapeHtml(DAYS[s.day - 1])}</td><td class="mono">${escapeHtml(s.startTime)}–${escapeHtml(s.endTime)}</td><td><b>${escapeHtml(s.subject)}</b></td><td>${escapeHtml(s.teacher ?? "")}</td><td>${escapeHtml(s.room ?? "")}</td></tr>`)
      .join("");
    const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Emploi du temps — ${escapeHtml(cls)}</title>
<style>*{font-family:Arial,Helvetica,sans-serif;box-sizing:border-box}body{margin:32px;color:#181c2a}
h1{font-size:18px;margin:0 0 2px}.sub{color:#666;font-size:12px;margin-bottom:16px}
table{width:100%;border-collapse:collapse;font-size:12px}
th{background:#4F66E8;color:#fff;text-align:left;padding:8px 10px;text-transform:uppercase;font-size:10px}
td{padding:8px 10px;border-bottom:1px solid #e5e7eb}.mono{font-family:'Courier New',monospace;white-space:nowrap}</style></head>
<body><h1>Emploi du temps — ${escapeHtml(cls)}</h1><div class="sub">${list.length} créneau(x)</div>
<table><thead><tr><th>Jour</th><th>Horaire</th><th>Matière</th><th>Enseignant</th><th>Salle</th></tr></thead><tbody>${rows}</tbody></table>
<script>window.onload=function(){window.print()}</script></body></html>`;
    const w = window.open("", "_blank");
    if (!w) { alert("Autorisez les fenêtres pop-up pour générer le PDF."); return; }
    w.document.write(html);
    w.document.close();
  };

  // Regroupé par classe puis jour.
  const grouped = useMemo(() => {
    const byClass = new Map<string, TimetableSlot[]>();
    for (const s of slots) {
      if (!byClass.has(s.className)) byClass.set(s.className, []);
      byClass.get(s.className)!.push(s);
    }
    return [...byClass.entries()].sort((a, b) => a[0].localeCompare(b[0], "fr", { numeric: true }));
  }, [slots]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Formulaire d'ajout */}
      <div className="ek-card" style={{ padding: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", marginBottom: 12 }}>
          <T fr="Ajouter un créneau" en="Add a slot" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
          <input list="ek-tt-classes" value={className} onChange={(e) => setClassName(e.target.value)} placeholder="Classe" style={input} />
          <select value={day} onChange={(e) => setDay(+e.target.value)} style={input}>
            {DAYS.map((d, i) => <option key={i} value={i + 1}>{d}</option>)}
          </select>
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={input} />
          <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={input} />
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Matière" style={input} />
          <input value={teacher} onChange={(e) => setTeacher(e.target.value)} placeholder="Enseignant (facultatif)" style={input} />
          <input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="Salle (facultatif)" style={input} />
          <datalist id="ek-tt-classes">{classNames.map((c) => <option key={c} value={c} />)}</datalist>
        </div>
        {err && <div style={{ marginTop: 10, fontSize: 12.5, color: "var(--danger)", fontWeight: 600 }}>{err}</div>}
        <button onClick={submit} disabled={pending} className="ek-btn ek-btn-primary" style={{ marginTop: 12, height: 38, fontSize: 13, opacity: pending ? 0.6 : 1 }}>
          <Icon name="plus" size={14} stroke={2.5} /> <T fr="Ajouter" en="Add" />
        </button>
      </div>

      {/* Liste */}
      {grouped.length === 0 ? (
        <div className="ek-card" style={{ padding: 28, textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
          <T fr="Aucun créneau. Ajoutez le premier ci-dessus." en="No slot yet. Add the first one above." />
        </div>
      ) : (
        grouped.map(([cls, list]) => {
          const allPublished = list.every((s) => s.published);
          const sorted = list.slice().sort(byDayTime);
          return (
          <div key={cls} className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--divider)", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>{cls}</div>
              <span className={`ek-chip ${allPublished ? "success" : "warn"}`} style={{ fontSize: 10.5 }}>
                {allPublished ? <T fr="Publié" en="Published" /> : <T fr="Brouillon" en="Draft" />}
              </span>
              <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                <button onClick={() => exportExcel(cls, list)} className="ek-btn ek-btn-outline" style={{ height: 30, fontSize: 12 }}>
                  <Icon name="download" size={13} /> Excel
                </button>
                <button onClick={() => exportPdf(cls, list)} className="ek-btn ek-btn-outline" style={{ height: 30, fontSize: 12 }}>
                  <Icon name="file" size={13} /> PDF
                </button>
                {allPublished ? (
                  <button onClick={() => publish(cls, false)} disabled={pending} className="ek-btn ek-btn-outline" style={{ height: 30, fontSize: 12 }}>
                    <T fr="Repasser en brouillon" en="Unpublish" />
                  </button>
                ) : (
                  <button onClick={() => publish(cls, true)} disabled={pending} className="ek-btn ek-btn-primary" style={{ height: 30, fontSize: 12 }}>
                    <Icon name="check" size={13} stroke={2.5} /> <T fr="Publier" en="Publish" />
                  </button>
                )}
              </div>
            </div>
            {sorted.map((s, i) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 18px", borderTop: i > 0 ? "1px solid var(--divider)" : "none" }}>
                <div style={{ width: 78, fontSize: 12, color: "var(--ink-3)", fontWeight: 600 }}>{DAYS[s.day - 1]}</div>
                <div style={{ width: 96, fontSize: 12, color: "var(--ink-2)", fontFamily: "var(--font-mono)" }}>{s.startTime}–{s.endTime}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{s.subject}</div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{[s.teacher, s.room].filter(Boolean).join(" · ")}</div>
                </div>
                <button onClick={() => remove(s.id)} disabled={pending} title="Supprimer" style={{ border: "none", background: "transparent", color: "var(--ink-4)", cursor: "pointer", padding: 4 }}>
                  <Icon name="trash" size={15} />
                </button>
              </div>
            ))}
          </div>
          );
        })
      )}
    </div>
  );
}
