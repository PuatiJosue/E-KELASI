"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import { DAYS, MONTHS, HOUR_PX, mondayOf, addDays, fmtDay, toMin, rowColor, readableText, type Row } from "./timetable-shared";

export function WeekCalendar({ rows }: { rows: Row[] }) {
  const [weekOffset, setWeekOffset] = useState(0);

  const valid = rows.filter((r) => r.startTime && r.endTime && r.subject.trim() && toMin(r.endTime) > toMin(r.startTime));
  if (valid.length === 0) {
    return (
      <div style={{ padding: 30, textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
        <T fr="Aucun cours à afficher pour le moment." en="No course to display yet." />
      </div>
    );
  }

  const maxDay = Math.max(5, ...valid.map((r) => r.day));
  const days = Array.from({ length: maxDay }, (_, i) => i + 1);

  const minH = Math.floor(Math.min(...valid.map((r) => toMin(r.startTime))) / 60);
  const maxH = Math.ceil(Math.max(...valid.map((r) => toMin(r.endTime))) / 60);
  const minMin = minH * 60;
  const totalH = (maxH - minH) * HOUR_PX;
  const hours = Array.from({ length: maxH - minH + 1 }, (_, i) => minH + i);
  const forDay = (d: number) => valid.filter((r) => r.day === d).sort((a, b) => toMin(a.startTime) - toMin(b.startTime));

  const monday = addDays(mondayOf(new Date()), weekOffset * 7);
  const dateFor = (dayNum: number) => addDays(monday, dayNum - 1);
  const rangeLabel = `${fmtDay(monday)} – ${fmtDay(addDays(monday, 6))} ${addDays(monday, 6).getFullYear()}`;

  const DAY_HEAD = 52;

  return (
    <div>
      {/* Barre de navigation par semaine */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "12px 14px" }}>
        <button onClick={() => setWeekOffset((w) => w - 1)} className="ek-btn ek-btn-outline" style={{ height: 30, width: 30, padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="chevL" size={16} />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>
          <Icon name="calendar" size={15} /> {rangeLabel}
        </div>
        <button onClick={() => setWeekOffset((w) => w + 1)} className="ek-btn ek-btn-outline" style={{ height: 30, width: 30, padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="chevR" size={16} />
        </button>
      </div>

      <div style={{ overflowX: "auto", padding: "0 14px 14px" }}>
        <div style={{ display: "flex", minWidth: 52 + days.length * 132 }}>
          {/* Colonne des heures */}
          <div style={{ width: 52, flexShrink: 0 }}>
            <div style={{ height: DAY_HEAD }} />
            <div style={{ position: "relative", height: totalH }}>
              {hours.map((h) => (
                <div key={h} style={{ position: "absolute", top: (h - minH) * HOUR_PX - 6, right: 8, fontSize: 10.5, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>
                  {String(h).padStart(2, "0")}:00
                </div>
              ))}
            </div>
          </div>

          {/* Une colonne par jour */}
          {days.map((d) => {
            const date = dateFor(d);
            return (
              <div key={d} style={{ flex: 1, minWidth: 128, borderLeft: "1px solid var(--divider)" }}>
                <div style={{ height: DAY_HEAD, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--ink)", textTransform: "uppercase", letterSpacing: "0.03em" }}>{DAYS[d - 1]}</span>
                  <span style={{ fontSize: 11, color: "var(--brand600, var(--brand))" }}>{fmtDay(date)}</span>
                </div>
                <div style={{ position: "relative", height: totalH, background: "var(--surface-2)" }}>
                  {hours.map((h) => (
                    <div key={h} style={{ position: "absolute", top: (h - minH) * HOUR_PX, left: 0, right: 0, borderTop: "1px solid var(--divider)" }} />
                  ))}
                  {forDay(d).map((r, i) => {
                    const top = ((toMin(r.startTime) - minMin) / 60) * HOUR_PX;
                    const height = Math.max(((toMin(r.endTime) - toMin(r.startTime)) / 60) * HOUR_PX - 4, 30);
                    const bg = rowColor(r);
                    const fg = readableText(bg);
                    return (
                      <div key={i} style={{ position: "absolute", top: top + 2, left: 4, right: 4, height, background: bg, borderRadius: 10, padding: "6px 8px", color: fg, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.18)" }}>
                        <div style={{ fontSize: 9.5, fontWeight: 600, opacity: 0.9 }}>{r.startTime} – {r.endTime}</div>
                        <div style={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.12, marginTop: 1 }}>{r.subject}</div>
                        {!!r.room && (
                          <div style={{ fontSize: 10, opacity: 0.9, marginTop: 3, display: "flex", alignItems: "center", gap: 3 }}>
                            <Icon name="pin" size={10} /> {r.room}
                          </div>
                        )}
                        {!!r.teacher && <div style={{ fontSize: 10, opacity: 0.85, marginTop: 1, lineHeight: 1.2 }}>{r.teacher}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

