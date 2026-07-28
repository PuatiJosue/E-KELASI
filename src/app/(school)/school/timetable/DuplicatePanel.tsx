"use client";

// Duplication d'un emploi du temps vers d'autres classes. Le panneau porte
// lui-même la sélection des classes cibles ; le parent ne garde que son
// ouverture et le message de confirmation.

import { useState, useTransition } from "react";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import { duplicateClassTimetable } from "./actions";
import type { Row } from "./timetable-shared";

export function DuplicatePanel({ candidates, rows, option, onCancel, onDone, onError }: {
  candidates: string[];
  rows: Row[];
  option: string;
  onCancel: () => void;
  onDone: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [targets, setTargets] = useState<string[]>([]);
  const [pending, start] = useTransition();
  const toggle = (c: string) => setTargets((ts) => (ts.includes(c) ? ts.filter((x) => x !== c) : [...ts, c]));

  const duplicate = () => {
    start(async () => {
      const res = await duplicateClassTimetable({
        targetClasses: targets, option,
        rows: rows.map(({ day, startTime, endTime, subject, teacher, room, color }) => ({ day, startTime, endTime, subject, teacher, room, color })),
        publish: false,
      });
      if (!res.ok) { onError(res.message); return; }
      const n = targets.length;
      onDone(`Emploi du temps copié (brouillon) vers ${n} classe${n > 1 ? "s" : ""}.`);
    });
  };

  return (
    <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--divider)", background: "var(--surface-2)" }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink)", marginBottom: 8 }}>
        <T fr="Dupliquer cet emploi du temps vers d'autres classes" en="Duplicate this timetable to other classes" />
      </div>
      {candidates.length === 0 ? (
        <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>
          <T fr="Aucune autre classe disponible. Ajoutez d'abord des classes à l'école." en="No other class available. Add classes to the school first." />
        </div>
      ) : (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {candidates.map((c) => {
            const on = targets.includes(c);
            return (
              <button key={c} onClick={() => toggle(c)} className={`ek-chip ${on ? "brand" : ""}`}
                style={{ fontSize: 11.5, cursor: "pointer", fontWeight: on ? 700 : 500, border: on ? "1px solid var(--brand)" : "1px solid var(--border-strong)" }}>
                {on ? "✓ " : ""}{c}
              </button>
            );
          })}
        </div>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={duplicate} disabled={pending || targets.length === 0} className="ek-btn ek-btn-primary" style={{ height: 34, fontSize: 12.5, opacity: pending || targets.length === 0 ? 0.6 : 1 }}>
          <Icon name="copy" size={13} /> <T fr="Dupliquer" en="Duplicate" /> ({targets.length})
        </button>
        <button onClick={onCancel} className="ek-btn ek-btn-outline" style={{ height: 34, fontSize: 12.5 }}>
          <T fr="Annuler" en="Cancel" />
        </button>
        <span style={{ fontSize: 11, color: "var(--ink-3)" }}>
          <T fr="Copie en brouillon ; remplace l'emploi du temps existant des classes cibles." en="Copied as a draft; replaces the target classes' existing timetable." />
        </span>
      </div>
    </div>
  );
}
