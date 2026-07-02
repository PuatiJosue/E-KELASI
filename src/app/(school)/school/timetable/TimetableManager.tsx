"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import type { TimetableSlot } from "@/lib/content-db";
import { saveClassTimetable, publishClassTimetable, deleteClassTimetable } from "./actions";

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

function escapeHtml(s: string) {
  return (s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

// Trie les créneaux par jour puis heure de début.
const byDayTime = (a: TimetableSlot, b: TimetableSlot) => a.day - b.day || a.startTime.localeCompare(b.startTime);

// Ligne locale éditable dans la grille (avant enregistrement).
type Row = { key: string; day: number; startTime: string; endTime: string; subject: string; teacher: string; room: string };

const newKey = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Math.random()));

const blankRow = (day = 1, startTime = "08:00", endTime = "09:00"): Row => ({
  key: newKey(), day, startTime, endTime, subject: "", teacher: "", room: "",
});

const input: React.CSSProperties = {
  height: 36, padding: "0 9px", borderRadius: 8, border: "1px solid var(--border-strong)",
  background: "var(--surface)", color: "var(--ink)", fontSize: 13, outline: "none", width: "100%",
};

export function TimetableManager({ slots, classNames, schoolName }: { slots: TimetableSlot[]; classNames: string[]; schoolName: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const [className, setClassName] = useState("");
  const [option, setOption] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [editing, setEditing] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Classes possédant déjà un emploi du temps (pour la sélection rapide).
  const stored = useMemo(() => {
    const byClass = new Map<string, TimetableSlot[]>();
    for (const s of slots) {
      if (!byClass.has(s.className)) byClass.set(s.className, []);
      byClass.get(s.className)!.push(s);
    }
    return byClass;
  }, [slots]);

  const existingClasses = useMemo(
    () => [...stored.keys()].sort((a, b) => a.localeCompare(b, "fr", { numeric: true })),
    [stored]
  );

  const currentSlots = className.trim() ? stored.get(className.trim()) ?? [] : [];
  const hasStored = currentSlots.length > 0;
  const isPublished = hasStored && currentSlots.every((s) => s.published);

  // (Re)charge la grille quand on change de classe sélectionnée.
  useEffect(() => {
    const list = (stored.get(className.trim()) ?? []).slice().sort(byDayTime);
    setRows(list.map((s) => ({
      key: s.id, day: s.day, startTime: s.startTime, endTime: s.endTime,
      subject: s.subject, teacher: s.teacher ?? "", room: s.room ?? "",
    })));
    setOption(list[0]?.option ?? "");
    // Publié → lecture seule (bouton Modifier) ; brouillon ou nouvelle classe → éditable.
    setEditing(!(list.length > 0 && list.every((s) => s.published)));
    setErr(null);
    // On ne recharge volontairement que sur changement de classe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [className]);

  const selectClass = (c: string) => setClassName(c);

  const addRow = () => {
    setRows((rs) => {
      const last = rs[rs.length - 1];
      return [...rs, blankRow(last?.day ?? 1, last?.endTime ?? "08:00", last?.endTime ?? "09:00")];
    });
  };
  const updateRow = (key: string, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const removeRow = (key: string) => setRows((rs) => rs.filter((r) => r.key !== key));

  const save = (publish: boolean) => {
    setErr(null);
    start(async () => {
      const res = await saveClassTimetable({
        className,
        option,
        rows: rows.map(({ day, startTime, endTime, subject, teacher, room }) => ({ day, startTime, endTime, subject, teacher, room })),
        publish,
      });
      if (!res.ok) { setErr(res.message); return; }
      setEditing(!publish); // après publication → lecture seule ; après brouillon → on reste en édition.
      router.refresh();
    });
  };

  const unpublish = () => start(async () => {
    const res = await publishClassTimetable(className, false);
    if (!res.ok) { setErr(res.message); return; }
    setEditing(true);
    router.refresh();
  });

  const removeAll = () => {
    if (!confirm("Supprimer tout l'emploi du temps de cette classe ?")) return;
    start(async () => {
      await deleteClassTimetable(className);
      setClassName("");
      router.refresh();
    });
  };

  // Créneaux exportés = grille locale courante (triée).
  const exportList = () => rows.slice().sort((a, b) => a.day - b.day || a.startTime.localeCompare(b.startTime));

  const exportExcel = () => {
    const cls = className.trim();
    const header = ["Jour", "Début", "Fin", "Matière", "Enseignant", "Salle"];
    const lines = [
      [schoolName || "Emploi du temps"],
      [`Classe : ${cls}${option ? " · " + option : ""}`],
      [],
      header,
      ...exportList().map((s) => [DAYS[s.day - 1], s.startTime, s.endTime, s.subject, s.teacher, s.room]),
    ];
    const csv = lines.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `emploi-du-temps-${cls.replace(/\s+/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const cls = className.trim();
    const list = exportList();
    const body = list
      .map((s) => `<tr><td>${escapeHtml(DAYS[s.day - 1])}</td><td class="mono">${escapeHtml(s.startTime)}–${escapeHtml(s.endTime)}</td><td><b>${escapeHtml(s.subject)}</b></td><td>${escapeHtml(s.teacher)}</td><td>${escapeHtml(s.room)}</td></tr>`)
      .join("");
    const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Emploi du temps — ${escapeHtml(cls)}</title>
<style>*{font-family:Arial,Helvetica,sans-serif;box-sizing:border-box}body{margin:32px;color:#181c2a}
.school{font-size:15px;font-weight:700;color:#4F66E8;margin:0 0 2px}
h1{font-size:18px;margin:0 0 2px}.sub{color:#666;font-size:12px;margin-bottom:16px}
table{width:100%;border-collapse:collapse;font-size:12px}
th{background:#4F66E8;color:#fff;text-align:left;padding:8px 10px;text-transform:uppercase;font-size:10px}
td{padding:8px 10px;border-bottom:1px solid #e5e7eb}.mono{font-family:'Courier New',monospace;white-space:nowrap}</style></head>
<body>${schoolName ? `<div class="school">${escapeHtml(schoolName)}</div>` : ""}<h1>Emploi du temps — ${escapeHtml(cls)}${option ? " · " + escapeHtml(option) : ""}</h1><div class="sub">${list.length} créneau(x)</div>
<table><thead><tr><th>Jour</th><th>Horaire</th><th>Matière</th><th>Enseignant</th><th>Salle</th></tr></thead><tbody>${body}</tbody></table>
<script>window.onload=function(){window.print()}</script></body></html>`;
    const w = window.open("", "_blank");
    if (!w) { alert("Autorisez les fenêtres pop-up pour générer le PDF."); return; }
    w.document.write(html);
    w.document.close();
  };

  const hasClass = className.trim().length > 0;
  const canExport = hasClass && rows.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Sélection / création de classe */}
      <div className="ek-card" style={{ padding: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", marginBottom: 10 }}>
          <T fr="Classe" en="Class" />
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input
            list="ek-tt-classes"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder="Nom de la classe (ex. 6e A)"
            style={{ ...input, height: 38, maxWidth: 260 }}
          />
          <input
            value={option}
            onChange={(e) => setOption(e.target.value)}
            placeholder="Option (facultatif)"
            style={{ ...input, height: 38, maxWidth: 200 }}
          />
          <datalist id="ek-tt-classes">
            {[...new Set([...existingClasses, ...classNames])].map((c) => <option key={c} value={c} />)}
          </datalist>
        </div>

        {existingClasses.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
            <span style={{ fontSize: 12, color: "var(--ink-3)", alignSelf: "center" }}>
              <T fr="Emplois du temps existants :" en="Existing timetables:" />
            </span>
            {existingClasses.map((c) => {
              const pub = (stored.get(c) ?? []).every((s) => s.published);
              const active = c === className.trim();
              return (
                <button
                  key={c}
                  onClick={() => selectClass(c)}
                  className={`ek-chip ${pub ? "success" : "warn"}`}
                  style={{ fontSize: 11.5, cursor: "pointer", opacity: active ? 1 : 0.75, fontWeight: active ? 700 : 500, border: active ? "1px solid var(--brand)" : undefined }}
                >
                  {c} · {pub ? <T fr="Publié" en="Published" /> : <T fr="Brouillon" en="Draft" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Éditeur de grille */}
      {!hasClass ? (
        <div className="ek-card" style={{ padding: 28, textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
          <T fr="Saisissez ou sélectionnez une classe pour créer son emploi du temps." en="Enter or pick a class to build its timetable." />
        </div>
      ) : (
        <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
          {/* En-tête : classe + statut + actions */}
          <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--divider)", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>{className.trim()}{option ? ` · ${option}` : ""}</div>
            {hasStored && (
              <span className={`ek-chip ${isPublished ? "success" : "warn"}`} style={{ fontSize: 10.5 }}>
                {isPublished ? <T fr="Publié" en="Published" /> : <T fr="Brouillon" en="Draft" />}
              </span>
            )}
            <div style={{ marginLeft: "auto", display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button onClick={exportExcel} disabled={!canExport} className="ek-btn ek-btn-outline" style={{ height: 30, fontSize: 12, opacity: canExport ? 1 : 0.5 }}>
                <Icon name="download" size={13} /> Excel
              </button>
              <button onClick={exportPdf} disabled={!canExport} className="ek-btn ek-btn-outline" style={{ height: 30, fontSize: 12, opacity: canExport ? 1 : 0.5 }}>
                <Icon name="file" size={13} /> PDF
              </button>
              {hasStored && (
                <button onClick={removeAll} disabled={pending} className="ek-btn ek-btn-outline" title="Supprimer l'emploi du temps" style={{ height: 30, fontSize: 12 }}>
                  <Icon name="trash" size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Grille */}
          {editing ? (
            <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
              {/* En-têtes de colonnes (desktop) */}
              <div className="ek-tt-head" style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr 0.9fr 1.4fr 1.2fr 0.9fr 34px", gap: 8, padding: "0 2px", fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase" }}>
                <div><T fr="Jour" en="Day" /></div>
                <div><T fr="Début" en="Start" /></div>
                <div><T fr="Fin" en="End" /></div>
                <div><T fr="Matière" en="Subject" /></div>
                <div><T fr="Enseignant" en="Teacher" /></div>
                <div><T fr="Salle" en="Room" /></div>
                <div />
              </div>

              {rows.length === 0 && (
                <div style={{ padding: "10px 2px", fontSize: 12.5, color: "var(--ink-3)" }}>
                  <T fr="Cliquez sur « Ajouter » pour créer la première ligne." en="Click “Add” to create the first row." />
                </div>
              )}

              {rows.map((r) => (
                <div key={r.key} style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr 0.9fr 1.4fr 1.2fr 0.9fr 34px", gap: 8, alignItems: "center" }}>
                  <select value={r.day} onChange={(e) => updateRow(r.key, { day: +e.target.value })} style={input}>
                    {DAYS.map((d, i) => <option key={i} value={i + 1}>{d}</option>)}
                  </select>
                  <input type="time" value={r.startTime} onChange={(e) => updateRow(r.key, { startTime: e.target.value })} style={input} />
                  <input type="time" value={r.endTime} onChange={(e) => updateRow(r.key, { endTime: e.target.value })} style={input} />
                  <input value={r.subject} onChange={(e) => updateRow(r.key, { subject: e.target.value })} placeholder="Matière" style={input} />
                  <input value={r.teacher} onChange={(e) => updateRow(r.key, { teacher: e.target.value })} placeholder="Enseignant" style={input} />
                  <input value={r.room} onChange={(e) => updateRow(r.key, { room: e.target.value })} placeholder="Salle" style={input} />
                  <button onClick={() => removeRow(r.key)} title="Supprimer la ligne" style={{ border: "none", background: "transparent", color: "var(--ink-4)", cursor: "pointer", padding: 4 }}>
                    <Icon name="trash" size={15} />
                  </button>
                </div>
              ))}

              <div style={{ marginTop: 4 }}>
                <button onClick={addRow} className="ek-btn ek-btn-outline" style={{ height: 36, fontSize: 13 }}>
                  <Icon name="plus" size={14} stroke={2.5} /> <T fr="Ajouter" en="Add" />
                </button>
              </div>

              {err && <div style={{ fontSize: 12.5, color: "var(--danger)", fontWeight: 600 }}>{err}</div>}

              {/* Boutons d'action */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6, paddingTop: 12, borderTop: "1px solid var(--divider)" }}>
                <button onClick={() => save(false)} disabled={pending || rows.length === 0} className="ek-btn ek-btn-outline" style={{ height: 38, fontSize: 13, opacity: pending || rows.length === 0 ? 0.6 : 1 }}>
                  <Icon name="save" size={14} /> <T fr="Enregistrer (brouillon)" en="Save (draft)" />
                </button>
                <button onClick={() => save(true)} disabled={pending || rows.length === 0} className="ek-btn ek-btn-primary" style={{ height: 38, fontSize: 13, opacity: pending || rows.length === 0 ? 0.6 : 1 }}>
                  <Icon name="send" size={14} /> <T fr="Publier" en="Publish" />
                </button>
              </div>
            </div>
          ) : (
            // Vue lecture seule (emploi du temps publié)
            <div>
              {rows.map((r, i) => (
                <div key={r.key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 18px", borderTop: i > 0 ? "1px solid var(--divider)" : "none" }}>
                  <div style={{ width: 78, fontSize: 12, color: "var(--ink-3)", fontWeight: 600 }}>{DAYS[r.day - 1]}</div>
                  <div style={{ width: 96, fontSize: 12, color: "var(--ink-2)", fontFamily: "var(--font-mono)" }}>{r.startTime}–{r.endTime}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{r.subject}</div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{[r.teacher, r.room].filter(Boolean).join(" · ")}</div>
                  </div>
                </div>
              ))}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: "12px 18px", borderTop: "1px solid var(--divider)" }}>
                <button onClick={() => setEditing(true)} className="ek-btn ek-btn-primary" style={{ height: 36, fontSize: 13 }}>
                  <Icon name="edit" size={14} /> <T fr="Modifier" en="Edit" />
                </button>
                <button onClick={unpublish} disabled={pending} className="ek-btn ek-btn-outline" style={{ height: 36, fontSize: 13 }}>
                  <T fr="Repasser en brouillon" en="Unpublish" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
