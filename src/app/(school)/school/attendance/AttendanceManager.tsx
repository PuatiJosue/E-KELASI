"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { setAttendance } from "./actions";
import type { StaffLite, DayAttendance, AttReportRow } from "@/lib/attendance-db";

const STATUSES: { key: string; label: string; color: string }[] = [
  { key: "present", label: "Présent", color: "#1D6650" },
  { key: "late", label: "Retard", color: "#C28728" },
  { key: "absent", label: "Absent", color: "#C03A2B" },
  { key: "justified", label: "Justifié", color: "#3A6DBC" },
];
const colorOf = (s?: string) => STATUSES.find((x) => x.key === s)?.color;

export function AttendanceManager({
  staff, date, attendance, report, from, to,
}: {
  staff: StaffLite[];
  date: string;
  attendance: DayAttendance;
  report: AttReportRow[];
  from: string;
  to: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [savingId, setSavingId] = useState<string | null>(null);

  const go = (params: Record<string, string>) => {
    const sp = new URLSearchParams({ date, from, to, ...params });
    router.push(`/school/attendance?${sp.toString()}`);
  };

  const mark = (staffId: string, status: string) => {
    setSavingId(staffId);
    startTransition(async () => {
      const r = await setAttendance(staffId, date, status);
      setSavingId(null);
      if (r.ok) router.refresh();
      else alert(r.message);
    });
  };

  return (
    <>
      {/* Registre du jour */}
      <div className="ek-card" style={{ padding: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>Registre du jour</div>
          <input type="date" value={date} onChange={(e) => go({ date: e.target.value })} style={{ ...inp, width: 170, marginLeft: "auto" }} />
        </div>

        {staff.length === 0 ? (
          <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>
            Aucun membre du personnel actif. Ajoutez-en dans <strong>Personnel</strong>.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {staff.map((s) => {
              const cur = attendance[s.id]?.status;
              return (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: "1px solid var(--divider)" }}>
                  <Avatar name={s.name} size={32} />
                  <div style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{s.name}</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {STATUSES.map((st) => {
                      const on = cur === st.key;
                      return (
                        <button
                          key={st.key}
                          onClick={() => mark(s.id, st.key)}
                          disabled={pending && savingId === s.id}
                          style={{
                            padding: "5px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer",
                            border: `1px solid ${on ? st.color : "var(--border)"}`,
                            background: on ? st.color : "var(--surface)",
                            color: on ? "#fff" : "var(--ink-3)",
                          }}
                        >
                          {st.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rapport de régularité */}
      <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--divider)", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>Rapport de régularité</div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--ink-3)" }}>
            <span>du</span>
            <input type="date" value={from} onChange={(e) => go({ from: e.target.value })} style={{ ...inp, width: 150 }} />
            <span>au</span>
            <input type="date" value={to} onChange={(e) => go({ to: e.target.value })} style={{ ...inp, width: 150 }} />
          </div>
        </div>
        <div className="ek-tablewrap">
          <div style={{ minWidth: 680 }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 0.8fr 0.8fr 0.8fr 0.9fr 1fr", padding: "10px 18px", fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em", background: "var(--surface-2)" }}>
              <div>Enseignant</div>
              <div style={{ textAlign: "center" }}>Présent</div>
              <div style={{ textAlign: "center" }}>Retard</div>
              <div style={{ textAlign: "center" }}>Absent</div>
              <div style={{ textAlign: "center" }}>Justifié</div>
              <div style={{ textAlign: "right" }}>Régularité</div>
            </div>
            {report.map((r, i) => (
              <div key={r.staffId} style={{ display: "grid", gridTemplateColumns: "2fr 0.8fr 0.8fr 0.8fr 0.9fr 1fr", padding: "11px 18px", alignItems: "center", fontSize: 12.5, borderTop: i > 0 ? "1px solid var(--divider)" : "none" }}>
                <div style={{ fontWeight: 600, color: "var(--ink)" }}>{r.name}</div>
                <div style={{ textAlign: "center", color: colorOf("present") }}>{r.present}</div>
                <div style={{ textAlign: "center", color: colorOf("late") }}>{r.late}</div>
                <div style={{ textAlign: "center", color: colorOf("absent") }}>{r.absent}</div>
                <div style={{ textAlign: "center", color: colorOf("justified") }}>{r.justified}</div>
                <div style={{ textAlign: "right", fontWeight: 700, fontFamily: "var(--font-display)", color: r.rate === null ? "var(--ink-3)" : r.rate >= 90 ? "#1D6650" : r.rate >= 70 ? "#C28728" : "#C03A2B" }}>
                  {r.rate === null ? "—" : `${r.rate}%`}
                </div>
              </div>
            ))}
            {report.length === 0 && (
              <div style={{ padding: 30, textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>Aucun membre du personnel.</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

const inp: React.CSSProperties = {
  padding: "8px 10px", borderRadius: 9, border: "1px solid var(--border-strong)",
  background: "var(--surface)", fontSize: 13, color: "var(--ink)",
};
