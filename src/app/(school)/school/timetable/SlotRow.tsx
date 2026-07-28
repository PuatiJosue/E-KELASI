"use client";

import { Icon } from "@/components/Icon";
import { DAYS, PALETTE, input, rowColor, type Row } from "./timetable-shared";

// Une ligne de la grille d'édition : horaire, matière, enseignant, salle et
// sélecteur de couleur (ouvert/fermé piloté par le parent).
export function SlotRow({ row: r, open, onToggleColor, onUpdate, onRemove }: {
  row: Row;
  open: boolean;
  onToggleColor: () => void;
  onUpdate: (patch: Partial<Row>) => void;
  onRemove: () => void;
}) {
  const bg = rowColor(r);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr 0.9fr 1.4fr 1.2fr 0.9fr 52px 32px", gap: 8, alignItems: "center", position: "relative" }}>
      <select value={r.day} onChange={(e) => onUpdate({ day: +e.target.value })} style={input}>
        {DAYS.map((d, i) => <option key={i} value={i + 1}>{d}</option>)}
      </select>
      <input type="time" value={r.startTime} onChange={(e) => onUpdate({ startTime: e.target.value })} style={input} />
      <input type="time" value={r.endTime} onChange={(e) => onUpdate({ endTime: e.target.value })} style={input} />
      <input value={r.subject} onChange={(e) => onUpdate({ subject: e.target.value })} placeholder="Matière" style={input} />
      <input value={r.teacher} onChange={(e) => onUpdate({ teacher: e.target.value })} placeholder="Enseignant" style={input} />
      <input value={r.room} onChange={(e) => onUpdate({ room: e.target.value })} placeholder="Salle" style={input} />
      {/* Sélecteur de couleur */}
      <button type="button" onClick={() => onToggleColor()} title="Couleur du cours"
        style={{ height: 34, borderRadius: 8, border: "1px solid var(--border-strong)", background: bg, cursor: "pointer" }} />
      <button onClick={() => onRemove()} title="Supprimer" style={{ border: "none", background: "transparent", color: "var(--ink-4)", cursor: "pointer", padding: 4 }}>
        <Icon name="trash" size={15} />
      </button>

      {open && (
        <div style={{ position: "absolute", right: 40, top: 38, zIndex: 20, background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: 10, padding: 10, boxShadow: "0 6px 20px rgba(0,0,0,0.18)", width: 190 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button type="button" onClick={() => { onUpdate({ color: "" }); onToggleColor(); }} title="Automatique"
              style={{ width: 26, height: 26, borderRadius: "50%", border: r.color === "" ? "2px solid var(--ink)" : "1px solid var(--border-strong)", background: "var(--surface-2)", color: "var(--ink-3)", cursor: "pointer", fontSize: 10 }}>A</button>
            {PALETTE.map((c) => (
              <button key={c} type="button" onClick={() => { onUpdate({ color: c }); onToggleColor(); }}
                style={{ width: 26, height: 26, borderRadius: "50%", background: c, border: r.color === c ? "2px solid var(--ink)" : "1px solid rgba(0,0,0,0.15)", cursor: "pointer" }} />
            ))}
            <input type="color" value={r.color || bg} onChange={(e) => onUpdate({ color: e.target.value })} title="Personnalisée"
              style={{ width: 30, height: 26, padding: 0, border: "1px solid var(--border-strong)", borderRadius: 6, background: "var(--surface)", cursor: "pointer" }} />
          </div>
        </div>
      )}
    </div>
  );
}
