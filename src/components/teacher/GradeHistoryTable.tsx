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
  const [search, setSearch] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (year === ALL || r.schoolYear === year) &&
        (trimester === ALL || String(r.trimester) === trimester) &&
        (className === ALL || r.className === className) &&
        (!q || r.studentName.toLowerCase().includes(q)) &&
        (!dateFrom || r.dateIso >= dateFrom) &&
        (!dateTo || r.dateIso <= dateTo)
    );
  }, [rows, year, trimester, className, search, dateFrom, dateTo]);

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

  const esc = (s: unknown) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

  const exportPdf = () => {
    const body = filtered
      .map(
        (r) =>
          `<tr><td>${esc(r.dateFr)}</td><td>${esc(r.studentName)}</td><td>${esc(r.subjectName)}</td><td>${esc(r.kind)}</td><td class="c">${esc(r.score)}/${esc(r.max)}</td><td class="c" style="color:${r.out20 >= 10 ? "#1D6650" : "#C03A2B"};font-weight:700">${esc(r.out20)}</td><td>${esc(r.mention)}</td></tr>`
      )
      .join("");
    const period = [
      year !== ALL ? year : null,
      trimester !== ALL ? `${trimester}e trim.` : null,
      className !== ALL ? className : null,
      dateFrom || dateTo ? `${dateFrom || "…"} → ${dateTo || "…"}` : null,
      search.trim() ? `« ${search.trim()} »` : null,
    ]
      .filter(Boolean)
      .join(" · ");
    const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Historique des notes</title>
<style>*{font-family:Arial,Helvetica,sans-serif;box-sizing:border-box}body{margin:32px;color:#1a1a2e}
h1{font-size:18px;margin:0 0 2px}.sub{color:#666;font-size:12px;margin-bottom:18px}
table{width:100%;border-collapse:collapse;font-size:11px}
th{background:#1f3a8a;color:#fff;text-align:left;padding:7px 8px;text-transform:uppercase;font-size:9.5px;letter-spacing:.03em}
td{padding:7px 8px;border-bottom:1px solid #e5e7eb}td.c{text-align:center}</style></head><body>
<h1>Historique des notes</h1>
<div class="sub">${esc(period || "Toutes les notes")} · ${filtered.length} note(s)</div>
<table><thead><tr><th>Date</th><th>Élève</th><th>Matière</th><th>Type</th><th>Note</th><th>Moy./20</th><th>Observations</th></tr></thead>
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
        <Field label={<T fr="Élève (nom)" en="Student (name)" />}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={frEn("Rechercher un élève…", "Search a student…")}
            style={{ ...sel, minWidth: 180 }}
          />
        </Field>
        <Field label={<T fr="Du" en="From" />}>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ ...sel, minWidth: 140 }} />
        </Field>
        <Field label={<T fr="Au" en="To" />}>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ ...sel, minWidth: 140 }} />
        </Field>
        <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
          <button
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="ek-btn ek-btn-outline"
            style={{ height: 38, fontSize: 12.5, opacity: filtered.length === 0 ? 0.5 : 1 }}
          >
            <Icon name="download" size={14} />
            <T fr="Excel (.csv)" en="Excel (.csv)" />
          </button>
          <button
            onClick={exportPdf}
            disabled={filtered.length === 0}
            className="ek-btn ek-btn-primary"
            style={{ height: 38, fontSize: 12.5, opacity: filtered.length === 0 ? 0.5 : 1 }}
          >
            <Icon name="file" size={14} />
            <T fr="PDF" en="PDF" />
          </button>
        </div>
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
