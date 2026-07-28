"use client";

// Exports de l'emploi du temps d'une classe. Extraits du composant : ce qui
// était capturé par fermeture est désormais passé en paramètre.

import { DAYS, escapeHtml, rowColor, type Row } from "./timetable-shared";

export type TimetableExport = { rows: Row[]; className: string; option: string; schoolName: string };

const exportList = (rows: Row[]) => rows.slice().sort((a, b) => a.day - b.day || a.startTime.localeCompare(b.startTime));

export function exportTimetableCsv({ rows, className, option, schoolName }: TimetableExport) {
    const cls = className.trim();
    const header = ["Jour", "Début", "Fin", "Matière", "Enseignant", "Salle"];
    const lines = [
      [schoolName || "Emploi du temps"],
      [`Classe : ${cls}${option ? " · " + option : ""}`],
      [],
      header,
      ...exportList(rows).map((s) => [DAYS[s.day - 1], s.startTime, s.endTime, s.subject, s.teacher, s.room]),
    ];
    const csv = lines.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `emploi-du-temps-${cls.replace(/\s+/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

export function exportTimetablePdf({ rows, className, option, schoolName }: TimetableExport) {
    const cls = className.trim();
    const list = exportList(rows);
    const body = list
      .map((s) => {
        const bg = rowColor(s);
        return `<tr><td>${escapeHtml(DAYS[s.day - 1])}</td><td class="mono">${escapeHtml(s.startTime)}–${escapeHtml(s.endTime)}</td><td><span class="dot" style="background:${bg}"></span><b>${escapeHtml(s.subject)}</b></td><td>${escapeHtml(s.teacher)}</td><td>${escapeHtml(s.room)}</td></tr>`;
      })
      .join("");
    const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Emploi du temps — ${escapeHtml(cls)}</title>
<style>*{font-family:Arial,Helvetica,sans-serif;box-sizing:border-box}body{margin:32px;color:#181c2a}
.school{font-size:15px;font-weight:700;color:#4F66E8;margin:0 0 2px}
h1{font-size:18px;margin:0 0 2px}.sub{color:#666;font-size:12px;margin-bottom:16px}
table{width:100%;border-collapse:collapse;font-size:12px}
th{background:#4F66E8;color:#fff;text-align:left;padding:8px 10px;text-transform:uppercase;font-size:10px}
td{padding:8px 10px;border-bottom:1px solid #e5e7eb}.mono{font-family:'Courier New',monospace;white-space:nowrap}
.dot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:6px;vertical-align:middle}</style></head>
<body>${schoolName ? `<div class="school">${escapeHtml(schoolName)}</div>` : ""}<h1>Emploi du temps — ${escapeHtml(cls)}${option ? " · " + escapeHtml(option) : ""}</h1><div class="sub">${list.length} cours</div>
<table><thead><tr><th>Jour</th><th>Horaire</th><th>Matière</th><th>Enseignant</th><th>Salle</th></tr></thead><tbody>${body}</tbody></table>
<script>window.onload=function(){window.print()}</script></body></html>`;
    const w = window.open("", "_blank");
    if (!w) { alert("Autorisez les fenêtres pop-up pour générer le PDF."); return; }
    w.document.write(html);
    w.document.close();
}
