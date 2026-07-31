"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { setAttendance, setAttendanceComment, clearAttendance } from "./actions";
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
  // Copie locale : la correction s'affiche immédiatement, le serveur confirme.
  const [marks, setMarks] = useState<DayAttendance>(attendance);

  // Changement de date/période : les pointages viennent du serveur.
  useEffect(() => { setMarks(attendance); }, [attendance]);

  const go = (params: Record<string, string>) => {
    const sp = new URLSearchParams({ date, from, to, ...params });
    router.push(`/school/attendance?${sp.toString()}`);
  };

  const run = (staffId: string, optimistic: () => void, save: () => Promise<{ ok: boolean; message?: string }>) => {
    optimistic();
    setSavingId(staffId);
    startTransition(async () => {
      const r = await save();
      setSavingId(null);
      if (r.ok) router.refresh();
      else {
        alert(r.message);
        router.refresh();
      }
    });
  };

  const mark = (staffId: string, status: string) => {
    // Recliquer le statut actif annule le pointage : l'agent redevient
    // « non pointé » et sort du calcul de régularité.
    if (marks[staffId]?.status === status) {
      run(
        staffId,
        () => setMarks((prev) => { const next = { ...prev }; delete next[staffId]; return next; }),
        () => clearAttendance(staffId, date)
      );
      return;
    }
    run(
      staffId,
      () => setMarks((prev) => ({ ...prev, [staffId]: { status, comment: prev[staffId]?.comment ?? null } })),
      () => setAttendance(staffId, date, status, marks[staffId]?.comment ?? undefined)
    );
  };

  const comment = (staffId: string, text: string) => {
    if (!marks[staffId]) return;
    const value = text.trim() || null;
    if ((marks[staffId].comment ?? null) === value) return; // rien n'a changé
    run(
      staffId,
      () => setMarks((prev) => ({ ...prev, [staffId]: { ...prev[staffId], comment: value } })),
      () => setAttendanceComment(staffId, date, text)
    );
  };

  return (
    <>
      {/* Registre du jour */}
      <div className="ek-card" style={{ padding: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6, flexWrap: "wrap" }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>Registre du jour</div>
          <input type="date" value={date} onChange={(e) => go({ date: e.target.value })} style={{ ...inp, width: 170, marginLeft: "auto" }} />
        </div>
        <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginBottom: 14 }}>
          Correction : recliquez le statut actif pour annuler le pointage (l&apos;agent sort alors du calcul de régularité).
        </div>

        {staff.length === 0 ? (
          <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>
            Aucun membre du personnel actif. Ajoutez-en dans <strong>Personnel</strong>.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {staff.map((s) => {
              const cur = marks[s.id]?.status;
              return (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: "1px solid var(--divider)", flexWrap: "wrap" }}>
                  <Avatar name={s.name} size={32} />
                  <div style={{ flex: 1, minWidth: 140, fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{s.name}</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {STATUSES.map((st) => {
                      const on = cur === st.key;
                      return (
                        <button
                          key={st.key}
                          onClick={() => mark(s.id, st.key)}
                          disabled={pending && savingId === s.id}
                          title={on ? "Cliquez pour annuler ce pointage" : undefined}
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
                  <CommentInput
                    key={`${s.id}:${marks[s.id]?.comment ?? ""}`}
                    value={marks[s.id]?.comment ?? ""}
                    disabled={!cur}
                    onCommit={(v) => comment(s.id, v)}
                  />
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

// Motif du pointage (congé, mission, retard justifié…) — enregistré à la
// sortie du champ, ou sur Entrée.
function CommentInput({
  value,
  disabled,
  onCommit,
}: {
  value: string;
  disabled: boolean;
  onCommit: (v: string) => void;
}) {
  const [text, setText] = useState(value);
  return (
    <input
      value={text}
      disabled={disabled}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => onCommit(text)}
      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
      placeholder={disabled ? "—" : "Motif…"}
      title={disabled ? "Pointez d'abord un statut." : "Motif de l'absence, du retard ou de la justification"}
      style={{
        width: 200, padding: "6px 9px", borderRadius: 8, fontSize: 12.5,
        border: "1px solid var(--border)", background: disabled ? "transparent" : "var(--surface)",
        color: "var(--ink)", opacity: disabled ? 0.5 : 1,
      }}
    />
  );
}

const inp: React.CSSProperties = {
  padding: "8px 10px", borderRadius: 9, border: "1px solid var(--border-strong)",
  background: "var(--surface)", fontSize: 13, color: "var(--ink)",
};
