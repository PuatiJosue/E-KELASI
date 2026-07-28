"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { T, useLang } from "@/lib/i18n";
import type { GradeHistoryRow } from "@/lib/teacher/grades";

const ALL = "__all__";

export function GradeHistoryTable({ rows }: { rows: GradeHistoryRow[] }) {
  const lang = useLang();
  const frEn = (fr: string, en: string) => (lang === "en" ? en : fr);

  const years = useMemo(() => Array.from(new Set(rows.map((r) => r.schoolYear))).sort().reverse(), [rows]);
  const classes = useMemo(() => Array.from(new Set(rows.map((r) => r.className))).sort(), [rows]);
  const subjects = useMemo(() => Array.from(new Set(rows.map((r) => r.subjectName))).sort(), [rows]);
  const kinds = useMemo(() => Array.from(new Set(rows.map((r) => r.kind))).sort(), [rows]);

  const [year, setYear] = useState<string>(years[0] ?? ALL);
  const [trimester, setTrimester] = useState<string>(ALL);
  const [className, setClassName] = useState<string>(ALL);
  const [subject, setSubject] = useState<string>(ALL);
  const [kind, setKind] = useState<string>(ALL);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [studentSearch, setStudentSearch] = useState<string>("");
  const [selected, setSelected] = useState<string | null>(null);

  // Notes filtrées par les critères communs (hors recherche d'élève).
  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (year === ALL || r.schoolYear === year) &&
          (trimester === ALL || String(r.trimester) === trimester) &&
          (className === ALL || r.className === className) &&
          (subject === ALL || r.subjectName === subject) &&
          (kind === ALL || r.kind === kind) &&
          (!dateFrom || r.dateIso >= dateFrom) &&
          (!dateTo || r.dateIso <= dateTo)
      ),
    [rows, year, trimester, className, subject, kind, dateFrom, dateTo]
  );

  // Élèves présents dans le jeu filtré (pour la liste de gauche).
  const students = useMemo(() => {
    const map = new Map<string, { name: string; className: string; count: number }>();
    for (const r of filtered) {
      const cur = map.get(r.studentName) ?? { name: r.studentName, className: r.className, count: 0 };
      cur.count += 1;
      map.set(r.studentName, cur);
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [filtered]);

  const visibleStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    return q ? students.filter((s) => s.name.toLowerCase().includes(q)) : students;
  }, [students, studentSearch]);

  // Élève sélectionné (par défaut le premier de la liste).
  const current = selected && students.some((s) => s.name === selected) ? selected : students[0]?.name ?? null;
  const studentRows = useMemo(
    () => filtered.filter((r) => r.studentName === current).sort((a, b) => b.dateIso.localeCompare(a.dateIso)),
    [filtered, current]
  );

  const esc = (s: unknown) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

  const exportCsv = () => {
    const header = ["Date", "Matière", "Type", "Note", "Sur", "Moyenne /20", "Observations"];
    const lines = [
      header,
      ...studentRows.map((r) => [r.dateFr, r.subjectName, r.kind, r.score, r.max, r.out20, r.mention]),
    ];
    const csv = lines.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `notes-${(current ?? "eleve").replace(/\s+/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const body = studentRows
      .map(
        (r) =>
          `<tr><td>${esc(r.dateFr)}</td><td>${esc(r.subjectName)}</td><td>${esc(r.kind)}</td><td class="c">${esc(r.score)}/${esc(r.max)}</td><td class="c" style="color:${r.out20 >= 10 ? "#1D6650" : "#C03A2B"};font-weight:700">${esc(r.out20)}</td><td>${esc(r.mention)}</td></tr>`
      )
      .join("");
    const period = [year !== ALL ? year : null, trimester !== ALL ? `${trimester}e trim.` : null, className !== ALL ? className : null, dateFrom || dateTo ? `${dateFrom || "…"} → ${dateTo || "…"}` : null]
      .filter(Boolean)
      .join(" · ");
    const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Notes — ${esc(current ?? "")}</title>
<style>*{font-family:Arial,Helvetica,sans-serif;box-sizing:border-box}body{margin:32px;color:#1a1a2e}
h1{font-size:18px;margin:0 0 2px}.sub{color:#666;font-size:12px;margin-bottom:18px}
table{width:100%;border-collapse:collapse;font-size:11px}
th{background:#1f3a8a;color:#fff;text-align:left;padding:7px 8px;text-transform:uppercase;font-size:9.5px}
td{padding:7px 8px;border-bottom:1px solid #e5e7eb}td.c{text-align:center}</style></head><body>
<h1>Notes — ${esc(current ?? "")}</h1>
<div class="sub">${esc(period || "Toutes périodes")} · ${studentRows.length} note(s)</div>
<table><thead><tr><th>Date</th><th>Matière</th><th>Type</th><th>Note</th><th>Moy./20</th><th>Observations</th></tr></thead>
<tbody>${body}</tbody></table>
<script>window.onload=function(){window.print()}</script></body></html>`;
    const w = window.open("", "_blank");
    if (!w) {
      alert("Autorisez les fenêtres pop-up pour générer le PDF.");
      return;
    }
    w.document.write(html);
    w.document.close();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Barre de filtres */}
      <div className="ek-card" style={{ padding: "16px 18px", display: "flex", gap: 14, alignItems: "flex-end", flexWrap: "wrap" }}>
        <Field label={<T fr="Année scolaire" en="School year" />}>
          <select value={year} onChange={(e) => setYear(e.target.value)} style={sel}>
            <option value={ALL}>{frEn("Toutes", "All")}</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </Field>
        <Field label={<T fr="Trimestre" en="Term" />}>
          <select value={trimester} onChange={(e) => setTrimester(e.target.value)} style={sel}>
            <option value={ALL}>{frEn("Tous", "All")}</option>
            <option value="1">1er trimestre</option>
            <option value="2">2e trimestre</option>
            <option value="3">3e trimestre</option>
            <option value="4">4e trimestre</option>
          </select>
        </Field>
        <Field label={<T fr="Classe" en="Class" />}>
          <select value={className} onChange={(e) => setClassName(e.target.value)} style={sel}>
            <option value={ALL}>{frEn("Toutes les classes", "All classes")}</option>
            {classes.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label={<T fr="Matière" en="Subject" />}>
          <select value={subject} onChange={(e) => setSubject(e.target.value)} style={sel}>
            <option value={ALL}>{frEn("Toutes les matières", "All subjects")}</option>
            {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label={<T fr="Type" en="Type" />}>
          <select value={kind} onChange={(e) => setKind(e.target.value)} style={sel}>
            <option value={ALL}>{frEn("Tous les types", "All types")}</option>
            {kinds.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </Field>
        <Field label={<T fr="Du" en="From" />}>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ ...sel, minWidth: 140 }} />
        </Field>
        <Field label={<T fr="Au" en="To" />}>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ ...sel, minWidth: 140 }} />
        </Field>
      </div>

      {/* Maître-détail : liste élèves | notes de l'élève */}
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 16, alignItems: "start" }} className="ek-stack-md">
        {/* Liste des élèves */}
        <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--divider)" }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)", marginBottom: 10 }}>
              <T fr="Liste des élèves" en="Student list" />
            </div>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--ink-3)", display: "flex" }}>
                <Icon name="search" size={14} />
              </span>
              <input
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder={frEn("Rechercher un élève…", "Search a student…")}
                style={{ width: "100%", padding: "8px 10px 8px 32px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)", fontSize: 13, color: "var(--ink)" }}
              />
            </div>
          </div>
          <div style={{ maxHeight: 520, overflowY: "auto" }} className="ek-scroll">
            {visibleStudents.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: "var(--ink-3)", fontSize: 12.5 }}>
                <T fr="Aucun élève." en="No student." />
              </div>
            ) : (
              visibleStudents.map((s) => {
                const on = s.name === current;
                return (
                  <button
                    key={s.name}
                    onClick={() => setSelected(s.name)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer",
                      border: "none", borderTop: "1px solid var(--divider)", textAlign: "left",
                      background: on ? "var(--brand-soft)" : "transparent",
                    }}
                  >
                    <span style={{ width: 30, height: 30, borderRadius: 8, background: on ? "var(--brand)" : "var(--surface-2)", color: on ? "#fff" : "var(--ink-3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, fontFamily: "var(--font-display)" }}>
                      {s.name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("")}
                    </span>
                    <span style={{ minWidth: 0, flex: 1 }}>
                      <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: on ? "var(--brand-600)" : "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
                      <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{s.className} · {s.count} {frEn("notes", "grades")}</span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
          <div style={{ padding: "10px 14px", borderTop: "1px solid var(--divider)", fontSize: 11.5, color: "var(--ink-3)" }}>
            {students.length} <T fr="élève(s)" en="student(s)" />
          </div>
        </div>

        {/* Notes de l'élève sélectionné */}
        <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--divider)", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>
              <T fr="Notes de" en="Grades of" /> : <span style={{ color: "var(--brand-600)" }}>{current ?? "—"}</span>
            </div>
            {current && (
              <span className="ek-chip brand">{studentRows.length} {frEn("notes", "grades")}</span>
            )}
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <button onClick={exportCsv} disabled={studentRows.length === 0} className="ek-btn ek-btn-outline" style={{ height: 34, fontSize: 12, opacity: studentRows.length === 0 ? 0.5 : 1 }}>
                <Icon name="download" size={13} /> Excel
              </button>
              <button onClick={exportPdf} disabled={studentRows.length === 0} className="ek-btn ek-btn-primary" style={{ height: 34, fontSize: 12, opacity: studentRows.length === 0 ? 0.5 : 1 }}>
                <Icon name="file" size={13} /> PDF
              </button>
            </div>
          </div>

          <div className="ek-tablewrap">
            <div style={{ minWidth: 620 }}>
              <div style={{ display: "grid", gridTemplateColumns: GRID, background: "var(--brand)", color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                <Th>Date</Th>
                <Th><T fr="Matière" en="Subject" /></Th>
                <Th><T fr="Type" en="Type" /></Th>
                <Th center><T fr="Note" en="Score" /></Th>
                <Th center><T fr="Moy. /20" en="Avg /20" /></Th>
                <Th><T fr="Observations" en="Remarks" /></Th>
              </div>
              {studentRows.length === 0 ? (
                <div style={{ padding: 36, textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
                  <T fr="Aucune note pour ces filtres." en="No grades for these filters." />
                </div>
              ) : (
                studentRows.map((r, i) => (
                  <div key={r.id} style={{ display: "grid", gridTemplateColumns: GRID, alignItems: "center", fontSize: 12.5, borderTop: "1px solid var(--divider)", background: i % 2 ? "var(--surface-2)" : "transparent" }}>
                    <Td><span style={{ fontFamily: "var(--font-display)", color: "var(--ink-2)" }}>{r.dateFr}</span></Td>
                    <Td>{r.subjectName}</Td>
                    <Td><span style={{ color: "var(--ink-3)" }}>{r.kind}</span></Td>
                    <Td center><span style={{ fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--ink)" }}>{r.score}/{r.max}</span></Td>
                    <Td center>
                      <span style={{ fontWeight: 700, fontFamily: "var(--font-display)", color: r.out20 >= 10 ? "#1D6650" : "#C03A2B" }}>{r.out20}</span>
                    </Td>
                    <Td><span style={{ color: "var(--ink-3)" }}>{r.mention}</span></Td>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const GRID = "1fr 1.4fr 1fr 0.9fr 0.8fr 1.3fr";

function Th({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return <div style={{ padding: "11px 14px", textAlign: center ? "center" : "left" }}>{children}</div>;
}
function Td({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return <div style={{ padding: "11px 14px", textAlign: center ? "center" : "left", color: "var(--ink-2)" }}>{children}</div>;
}
function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 10.5, color: "var(--ink-3)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</span>
      {children}
    </label>
  );
}

const sel: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid var(--border-strong)",
  background: "var(--surface)",
  color: "var(--ink)",
  fontSize: 13,
  fontFamily: "inherit",
  minWidth: 150,
};
