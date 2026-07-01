"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import type { TimetableSlot } from "@/lib/content-db";
import { addTimetableSlot, deleteTimetableSlot } from "./actions";

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

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
        grouped.map(([cls, list]) => (
          <div key={cls} className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "13px 18px", borderBottom: "1px solid var(--divider)", fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>{cls}</div>
            {list.map((s, i) => (
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
        ))
      )}
    </div>
  );
}
