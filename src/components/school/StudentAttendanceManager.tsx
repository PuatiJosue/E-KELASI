"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { T, useLang } from "@/lib/i18n";
import { setStudentAttendance } from "@/app/(school)/school/student-attendance/actions";
import type { StudentLite, StudentDayAttendance } from "@/lib/attendance-db";

const STATUSES: { key: string; fr: string; en: string; color: string }[] = [
  { key: "present",   fr: "Présent",  en: "Present", color: "#1D6650" },
  { key: "late",      fr: "Retard",   en: "Late",    color: "#C28728" },
  { key: "absent",    fr: "Absent",   en: "Absent",  color: "#C03A2B" },
  { key: "justified", fr: "Justifié", en: "Excused", color: "#3A6DBC" },
];
const labelOf = (k: string) => STATUSES.find((s) => s.key === k);

export function StudentAttendanceManager({
  students,
  date,
  attendance,
  schoolName,
}: {
  students: StudentLite[];
  date: string;
  attendance: StudentDayAttendance;
  schoolName: string;
}) {
  const router = useRouter();
  const lang = useLang();
  const [pending, startTransition] = useTransition();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [marks, setMarks] = useState<StudentDayAttendance>(attendance);

  // Élèves groupés par classe.
  const classes = useMemo(() => {
    const map = new Map<string, StudentLite[]>();
    for (const s of students) {
      if (!map.has(s.className)) map.set(s.className, []);
      map.get(s.className)!.push(s);
    }
    return [...map.entries()].map(([name, list]) => ({ name, list })).sort((a, b) => a.name.localeCompare(b.name));
  }, [students]);

  const [selected, setSelected] = useState<string>(classes[0]?.name ?? "");
  const current = classes.find((c) => c.name === selected)?.list ?? [];

  const changeDate = (d: string) => {
    const sp = new URLSearchParams({ date: d });
    router.push(`/school/student-attendance?${sp.toString()}`);
  };

  const mark = (studentId: string, status: string) => {
    setMarks((prev) => ({ ...prev, [studentId]: status }));
    setSavingId(studentId);
    startTransition(async () => {
      const r = await setStudentAttendance(studentId, date, status);
      setSavingId(null);
      if (!r.ok) {
        alert(r.message);
        router.refresh();
      }
    });
  };

  // Compteurs sur la classe sélectionnée.
  const counts = useMemo(() => {
    const c = { present: 0, late: 0, absent: 0, justified: 0 };
    for (const s of current) {
      const st = marks[s.id];
      if (st && st in c) (c as any)[st]++;
    }
    return c;
  }, [current, marks]);

  const dateFr = new Date(date).toLocaleDateString(lang === "en" ? "en-GB" : "fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });

  const exportCsv = () => {
    const header = ["N°", "Nom et prénoms", "Classe", "Date", "Statut"];
    const lines = [
      header,
      ...current.map((s, i) => [
        i + 1,
        s.name,
        s.className,
        dateFr,
        labelOf(marks[s.id] ?? "")?.fr ?? "—",
      ]),
    ];
    const csv = lines.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `presences-${selected.replace(/\s+/g, "_")}-${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const rows = current
      .map((s, i) => {
        const st = labelOf(marks[s.id] ?? "");
        return `<tr><td class="num">${i + 1}</td><td>${escapeHtml(s.name)}</td><td style="color:${st?.color ?? "#888"};font-weight:600">${st?.fr ?? "—"}</td></tr>`;
      })
      .join("");
    const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Présences — ${escapeHtml(selected)}</title>
<style>
  *{font-family:Arial,Helvetica,sans-serif;box-sizing:border-box}
  body{margin:32px;color:#1a1a2e}
  h1{font-size:18px;margin:0 0 2px}
  .sub{color:#666;font-size:12px;margin-bottom:18px}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th{background:#1f3a8a;color:#fff;text-align:left;padding:8px 10px;text-transform:uppercase;font-size:10px;letter-spacing:.04em}
  td{padding:8px 10px;border-bottom:1px solid #e5e7eb}
  td.num{color:#888;width:48px}
  .totals{margin-top:16px;font-size:12px;display:flex;gap:18px;flex-wrap:wrap}
  .totals b{font-weight:700}
</style></head><body>
  <h1>${escapeHtml(schoolName)}</h1>
  <div class="sub">Liste de présence — ${escapeHtml(selected)} · ${dateFr} · ${current.length} élève(s)</div>
  <table><thead><tr><th>N°</th><th>Nom et prénoms</th><th>Statut</th></tr></thead><tbody>${rows}</tbody></table>
  <div class="totals">
    <span>Présents : <b>${counts.present}</b></span>
    <span>Retards : <b>${counts.late}</b></span>
    <span>Absents : <b>${counts.absent}</b></span>
    <span>Justifiés : <b>${counts.justified}</b></span>
  </div>
  <script>window.onload=function(){window.print()}</script>
</body></html>`;
    const w = window.open("", "_blank");
    if (!w) {
      alert("Autorisez les fenêtres pop-up pour générer le PDF.");
      return;
    }
    w.document.write(html);
    w.document.close();
  };

  if (classes.length === 0) {
    return (
      <div className="ek-card" style={{ padding: 30, textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
        <T fr="Aucun élève actif. Les élèves apparaissent ici une fois inscrits." en="No active students yet." />
      </div>
    );
  }

  return (
    <>
      {/* 1. Sélection de la classe */}
      <div className="ek-card" style={{ padding: 18 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)", marginBottom: 12 }}>
          1. <T fr="Sélectionner la classe" en="Select the class" />
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {classes.map((c) => {
            const on = c.name === selected;
            return (
              <button
                key={c.name}
                onClick={() => setSelected(c.name)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 12, cursor: "pointer",
                  border: `1.5px solid ${on ? "var(--brand)" : "var(--border)"}`,
                  background: on ? "var(--brand-soft)" : "var(--surface)",
                  textAlign: "left",
                }}
              >
                <span style={{ width: 34, height: 34, borderRadius: 9, background: on ? "var(--brand)" : "var(--surface-2)", color: on ? "#fff" : "var(--ink-3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="users" size={16} />
                </span>
                <span>
                  <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: on ? "var(--brand-600)" : "var(--ink)" }}>{c.name}</span>
                  <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{c.list.length} <T fr="élèves" en="students" /></span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Liste des élèves */}
      <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--divider)", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>
            2. <T fr="Liste des élèves" en="Student list" /> — <span style={{ color: "var(--brand-600)" }}>{selected}</span>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <input type="date" value={date} onChange={(e) => changeDate(e.target.value)} style={inp} />
            <button onClick={exportCsv} className="ek-btn ek-btn-outline" style={{ height: 36, fontSize: 12 }}>
              <Icon name="download" size={13} /> Excel
            </button>
            <button onClick={exportPdf} className="ek-btn ek-btn-outline" style={{ height: 36, fontSize: 12 }}>
              <Icon name="file" size={13} /> PDF
            </button>
          </div>
        </div>

        <div className="ek-tablewrap">
          <div style={{ minWidth: 640 }}>
            <div style={{ display: "grid", gridTemplateColumns: GRID, padding: "10px 18px", fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em", background: "var(--surface-2)" }}>
              <div>N°</div>
              <div><T fr="Nom et prénoms" en="Full name" /></div>
              <div><T fr="Statut" en="Status" /></div>
            </div>
            {current.map((s, i) => {
              const cur = marks[s.id];
              return (
                <div key={s.id} style={{ display: "grid", gridTemplateColumns: GRID, padding: "10px 18px", alignItems: "center", borderTop: "1px solid var(--divider)" }}>
                  <div style={{ color: "var(--ink-3)", fontSize: 12, fontFamily: "var(--font-display)" }}>{i + 1}</div>
                  <div style={{ fontWeight: 600, color: "var(--ink)", fontSize: 13 }}>{s.name}</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {STATUSES.map((st) => {
                      const on = cur === st.key;
                      return (
                        <button
                          key={st.key}
                          onClick={() => mark(s.id, st.key)}
                          disabled={pending && savingId === s.id}
                          style={{
                            padding: "5px 11px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer",
                            border: `1px solid ${on ? st.color : "var(--border)"}`,
                            background: on ? st.color : "var(--surface)",
                            color: on ? "#fff" : "var(--ink-3)",
                          }}
                        >
                          <T fr={st.fr} en={st.en} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Totaux (façon image 2) */}
        <div style={{ padding: "12px 18px", borderTop: "1px solid var(--divider)", display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", fontSize: 12.5 }}>
          <span style={{ fontWeight: 700, color: "var(--ink)" }}>
            <T fr="Total élèves" en="Total students" /> : {current.length}
          </span>
          <span style={{ marginLeft: "auto", display: "flex", gap: 16, flexWrap: "wrap" }}>
            <Dot color="#1D6650" label={`${labelOf("present")!.fr} : ${counts.present}`} />
            <Dot color="#C28728" label={`${labelOf("late")!.fr} : ${counts.late}`} />
            <Dot color="#C03A2B" label={`${labelOf("absent")!.fr} : ${counts.absent}`} />
            <Dot color="#3A6DBC" label={`${labelOf("justified")!.fr} : ${counts.justified}`} />
          </span>
        </div>
      </div>
    </>
  );
}

const GRID = "0.4fr 2fr 2.4fr";

function Dot({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--ink-2)" }}>
      <span style={{ width: 9, height: 9, borderRadius: "50%", background: color }} />
      {label}
    </span>
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

const inp: React.CSSProperties = {
  padding: "8px 10px", borderRadius: 9, border: "1px solid var(--border-strong)",
  background: "var(--surface)", fontSize: 13, color: "var(--ink)", width: 160,
};
