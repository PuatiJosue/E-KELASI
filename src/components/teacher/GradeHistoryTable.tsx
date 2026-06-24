"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { T, useLang } from "@/lib/i18n";
import type { GradeHistoryRow } from "@/lib/teacher-db";

const ALL = "__all__";

export function GradeHistoryTable({ rows }: { rows: GradeHistoryRow[] }) {
  const lang = useLang();
  const frEn = (fr: string, en: string) => (lang === "en" ? en : fr);
  const years = useMemo(
    () => Array.from(new Set(rows.map((r) => r.schoolYear))).sort().reverse(),
    [rows]
  );
  const classes = useMemo(
    () => Array.from(new Set(rows.map((r) => r.className))).sort(),
    [rows]
  );

  const [year, setYear] = useState<string>(years[0] ?? ALL);
  const [trimester, setTrimester] = useState<string>(ALL);
  const [className, setClassName] = useState<string>(ALL);

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (year === ALL || r.schoolYear === year) &&
          (trimester === ALL || String(r.trimester) === trimester) &&
          (className === ALL || r.className === className)
      ),
    [rows, year, trimester, className]
  );

  const exportCsv = () => {
    const header = ["Date", "Année scolaire", "Trimestre", "Classe", "Élève", "Matière", "Type", "Note", "Sur", "Coef.", "Moyenne /20", "Observations"];
    const lines = [
      header,
      ...filtered.map((r) => [
        r.dateFr,
        r.schoolYear,
        r.trimesterShort,
        r.className,
        r.studentName,
        r.subjectName,
        r.kind,
        r.score,
        r.max,
        r.coefficient,
        r.out20,
        r.mention,
      ]),
    ];
    const csv = lines.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "historique-notes.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
      {/* Barre de filtres (façon « Consultation des notes ») */}
      <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--divider)", display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap" }}>
        <Field label={<T fr="Année scolaire" en="School year" />}>
          <select value={year} onChange={(e) => setYear(e.target.value)} style={sel}>
            <option value={ALL}>{frEn("Toutes", "All")}</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
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
            <option value={ALL}>{frEn("Toutes", "All")}</option>
            {classes.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>
        <button
          onClick={exportCsv}
          disabled={filtered.length === 0}
          className="ek-btn ek-btn-primary"
          style={{ height: 38, fontSize: 12.5, marginLeft: "auto", opacity: filtered.length === 0 ? 0.5 : 1 }}
        >
          <Icon name="download" size={14} />
          <T fr="Télécharger Excel (.csv)" en="Download Excel (.csv)" />
        </button>
      </div>

      <div className="ek-tablewrap">
        <div style={{ minWidth: 760 }}>
          {/* En-tête bleu */}
          <div style={{ display: "grid", gridTemplateColumns: GRID, background: "var(--brand)", color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
            <Th>Date</Th>
            <Th><T fr="Élève" en="Student" /></Th>
            <Th><T fr="Matière" en="Subject" /></Th>
            <Th><T fr="Type" en="Kind" /></Th>
            <Th center><T fr="Note" en="Score" /></Th>
            <Th center><T fr="Moy. /20" en="Avg /20" /></Th>
            <Th><T fr="Observations" en="Remarks" /></Th>
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: 36, textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
              <T fr="Aucune note enregistrée pour ces filtres." en="No grades recorded for these filters." />
            </div>
          ) : (
            filtered.map((r, i) => (
              <div key={r.id} style={{ display: "grid", gridTemplateColumns: GRID, alignItems: "center", fontSize: 12.5, borderTop: i > 0 ? "1px solid var(--divider)" : "none", background: i % 2 ? "var(--surface-2)" : "transparent" }}>
                <Td><span style={{ fontFamily: "var(--font-display)", color: "var(--ink-2)" }}>{r.dateFr}</span></Td>
                <Td><span style={{ fontWeight: 600, color: "var(--ink)" }}>{r.studentName}</span></Td>
                <Td>{r.subjectName}</Td>
                <Td><span style={{ color: "var(--ink-3)" }}>{r.kind}</span></Td>
                <Td center><span style={{ fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--ink)" }}>{r.score}/{r.max}</span></Td>
                <Td center>
                  <span style={{ fontWeight: 700, fontFamily: "var(--font-display)", color: r.out20 >= 10 ? "#1D6650" : "#C03A2B" }}>
                    {r.out20}
                  </span>
                </Td>
                <Td><span style={{ color: "var(--ink-3)" }}>{r.mention}</span></Td>
              </div>
            ))
          )}
        </div>
      </div>

      {filtered.length > 0 && (
        <div style={{ padding: "10px 18px", borderTop: "1px solid var(--divider)", fontSize: 12, color: "var(--ink-3)" }}>
          {filtered.length} <T fr="note(s) dans l'historique" en="grade(s) in history" />
        </div>
      )}
    </div>
  );
}

const GRID = "1fr 1.6fr 1.3fr 1.2fr 0.9fr 0.8fr 1.1fr";

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
