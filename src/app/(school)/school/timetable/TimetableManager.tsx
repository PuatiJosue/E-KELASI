"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import type { TimetableSlot } from "@/lib/content-db";
import { saveClassTimetable, publishClassTimetable, deleteClassTimetable } from "./actions";
import { DAYS, PALETTE, byDayTime, blankRow, input, rowColor, readableText, type Row } from "./timetable-shared";
import { WeekCalendar } from "./WeekCalendar";
import { SlotRow } from "./SlotRow";
import { DuplicatePanel } from "./DuplicatePanel";
import { PreviewOverlay } from "./PreviewOverlay";
import { exportTimetableCsv, exportTimetablePdf } from "./timetable-exports";

export function TimetableManager({ slots, classNames, schoolName }: { slots: TimetableSlot[]; classNames: string[]; schoolName: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const [className, setClassName] = useState("");
  const [option, setOption] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [editing, setEditing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [colorFor_, setColorFor] = useState<string | null>(null); // ligne dont la palette est ouverte
  const [preview, setPreview] = useState(false);

  // Duplication.
  const [showDup, setShowDup] = useState(false);
  const [dupMsg, setDupMsg] = useState<string | null>(null);

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
  const allClasses = useMemo(
    () => [...new Set([...existingClasses, ...classNames])].filter(Boolean).sort((a, b) => a.localeCompare(b, "fr", { numeric: true })),
    [existingClasses, classNames]
  );

  const currentSlots = className.trim() ? stored.get(className.trim()) ?? [] : [];
  const hasStored = currentSlots.length > 0;
  const isPublished = hasStored && currentSlots.every((s) => s.published);

  useEffect(() => {
    const list = (stored.get(className.trim()) ?? []).slice().sort(byDayTime);
    setRows(list.map((s) => ({
      key: s.id, day: s.day, startTime: s.startTime, endTime: s.endTime,
      subject: s.subject, teacher: s.teacher ?? "", room: s.room ?? "", color: s.color ?? "",
    })));
    setOption(list[0]?.option ?? "");
    setEditing(!(list.length > 0 && list.every((s) => s.published)));
    setErr(null);
    setPreview(false);
    setColorFor(null);
    setShowDup(false);
    setDupMsg(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [className]);

  const addRow = () => {
    setRows((rs) => {
      const last = rs[rs.length - 1];
      return [...rs, blankRow(last?.day ?? 1, last?.endTime ?? "08:00", last?.endTime ?? "09:00")];
    });
  };
  const updateRow = (key: string, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const removeRow = (key: string) => setRows((rs) => rs.filter((r) => r.key !== key));

  const save = (publish: boolean) => {
    setErr(null);
    start(async () => {
      const res = await saveClassTimetable({
        className, option,
        rows: rows.map(({ day, startTime, endTime, subject, teacher, room, color }) => ({ day, startTime, endTime, subject, teacher, room, color })),
        publish,
      });
      if (!res.ok) { setErr(res.message); return; }
      setEditing(!publish);
      setPreview(false);
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


  const exportArgs = { rows, className, option, schoolName };
  const exportExcel = () => exportTimetableCsv(exportArgs);
  const exportPdf = () => exportTimetablePdf(exportArgs);

  const hasClass = className.trim().length > 0;
  const canExport = hasClass && rows.length > 0;
  const dupCandidates = allClasses.filter((c) => c !== className.trim());

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Sélection / création de classe */}
      <div className="ek-card" style={{ padding: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", marginBottom: 10 }}>
          <T fr="Classe" en="Class" />
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input list="ek-tt-classes" value={className} onChange={(e) => setClassName(e.target.value)} placeholder="Nom de la classe (ex. 6e A)" style={{ ...input, height: 38, maxWidth: 260 }} />
          <input value={option} onChange={(e) => setOption(e.target.value)} placeholder="Option (facultatif)" style={{ ...input, height: 38, maxWidth: 200 }} />
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
                <button key={c} onClick={() => setClassName(c)} className={`ek-chip ${pub ? "success" : "warn"}`}
                  style={{ fontSize: 11.5, cursor: "pointer", opacity: active ? 1 : 0.75, fontWeight: active ? 700 : 500, border: active ? "1px solid var(--brand)" : undefined }}>
                  {c} · {pub ? <T fr="Publié" en="Published" /> : <T fr="Brouillon" en="Draft" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

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
              <button onClick={() => setPreview(true)} disabled={!canExport} className="ek-btn ek-btn-outline" style={{ height: 30, fontSize: 12, opacity: canExport ? 1 : 0.5 }}>
                <Icon name="eye" size={13} /> <T fr="Aperçu" en="Preview" />
              </button>
              <button onClick={() => { setShowDup((v) => !v); setDupMsg(null); }} disabled={!canExport} className={`ek-btn ${showDup ? "ek-btn-primary" : "ek-btn-outline"}`} style={{ height: 30, fontSize: 12, opacity: canExport ? 1 : 0.5 }}>
                <Icon name="copy" size={13} /> <T fr="Dupliquer" en="Duplicate" />
              </button>
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

          {dupMsg && (
            <div style={{ padding: "9px 18px", borderBottom: "1px solid var(--divider)", background: "var(--accent-50)", color: "var(--accent)", fontSize: 12.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 7 }}>
              <Icon name="check" size={14} /> {dupMsg}
            </div>
          )}

          {showDup && (
            <DuplicatePanel
              candidates={dupCandidates}
              rows={rows}
              option={option}
              onCancel={() => setShowDup(false)}
              onDone={(msg) => { setDupMsg(msg); setShowDup(false); router.refresh(); }}
              onError={(msg) => setErr(msg)}
            />
          )}

          {editing ? (
            <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ overflowX: "auto" }}>
                <div style={{ minWidth: 760, display: "flex", flexDirection: "column", gap: 8 }}>
                  {/* En-têtes */}
                  <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr 0.9fr 1.4fr 1.2fr 0.9fr 52px 32px", gap: 8, padding: "0 2px", fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase" }}>
                    <div><T fr="Jour" en="Day" /></div>
                    <div><T fr="Début" en="Start" /></div>
                    <div><T fr="Fin" en="End" /></div>
                    <div><T fr="Matière" en="Subject" /></div>
                    <div><T fr="Enseignant" en="Teacher" /></div>
                    <div><T fr="Salle" en="Room" /></div>
                    <div><T fr="Coul." en="Color" /></div>
                    <div />
                  </div>

                  {rows.length === 0 && (
                    <div style={{ padding: "10px 2px", fontSize: 12.5, color: "var(--ink-3)" }}>
                      <T fr="Cliquez sur « Ajouter » pour créer le premier cours." en="Click “Add” to create the first course." />
                    </div>
                  )}

                  {rows.map((r) => (
                    <SlotRow
                      key={r.key}
                      row={r}
                      open={colorFor_ === r.key}
                      onToggleColor={() => setColorFor(colorFor_ === r.key ? null : r.key)}
                      onUpdate={(patch) => updateRow(r.key, patch)}
                      onRemove={() => removeRow(r.key)}
                    />
                  ))}

                  <div style={{ marginTop: 4 }}>
                    <button onClick={addRow} className="ek-btn ek-btn-outline" style={{ height: 36, fontSize: 13 }}>
                      <Icon name="plus" size={14} stroke={2.5} /> <T fr="Ajouter un cours" en="Add a course" />
                    </button>
                  </div>
                </div>
              </div>

              {err && <div style={{ fontSize: 12.5, color: "var(--danger)", fontWeight: 600 }}>{err}</div>}

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6, paddingTop: 12, borderTop: "1px solid var(--divider)" }}>
                <button onClick={() => save(false)} disabled={pending || rows.length === 0} className="ek-btn ek-btn-outline" style={{ height: 38, fontSize: 13, opacity: pending || rows.length === 0 ? 0.6 : 1 }}>
                  <Icon name="save" size={14} /> <T fr="Enregistrer (brouillon)" en="Save (draft)" />
                </button>
                <button onClick={() => save(true)} disabled={pending || rows.length === 0} className="ek-btn ek-btn-primary" style={{ height: 38, fontSize: 13, opacity: pending || rows.length === 0 ? 0.6 : 1 }}>
                  <Icon name="send" size={14} /> <T fr="Publier" en="Publish" />
                </button>
                <span style={{ fontSize: 11.5, color: "var(--ink-3)", alignSelf: "center" }}>
                  <T fr="Une fois publié, l'emploi du temps est visible par les enseignants, élèves et parents." en="Once published, the timetable is visible to teachers, students and parents." />
                </span>
              </div>

              {/* Aperçu calendrier en direct */}
              {rows.length > 0 && (
                <div style={{ marginTop: 8, borderTop: "1px solid var(--divider)", marginLeft: -14, marginRight: -14 }}>
                  <div style={{ padding: "12px 18px 0", fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                    <T fr="Aperçu" en="Preview" />
                  </div>
                  <WeekCalendar rows={rows} />
                </div>
              )}
            </div>
          ) : (
            // Vue lecture seule (publié) — calendrier
            <div>
              <WeekCalendar rows={rows} />
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

      {preview && (
        <PreviewOverlay rows={rows} className={className} option={option} onClose={() => setPreview(false)} />
      )}
    </div>
  );
}

