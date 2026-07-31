"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { ClassPicker } from "@/components/school/ClassPicker";
import { SexBadge } from "@/components/SexBadge";
import { T, useLang } from "@/lib/i18n";
import { setStudentAttendance } from "@/app/(school)/school/student-attendance/actions";
import type { StudentLite, StudentDayAttendance } from "@/lib/attendance-db";

const STATUSES: { key: string; fr: string; en: string; color: string }[] = [
  { key: "present",   fr: "Présent",  en: "Present", color: "#16A34A" },
  { key: "late",      fr: "Retard",   en: "Late",    color: "#D97706" },
  { key: "absent",    fr: "Absent",   en: "Absent",  color: "#E11D48" },
  { key: "justified", fr: "Justifié", en: "Excused", color: "#4F66E8" },
];
const labelOf = (k: string) => STATUSES.find((s) => s.key === k);

type SaveResult = { ok: true } | { ok: false; message: string };

export function StudentAttendanceManager({
  students,
  date,
  attendance,
  schoolName,
  basePath = "/school/student-attendance",
  saveAction = setStudentAttendance,
  clearAction,
  commentAction,
}: {
  students: StudentLite[];
  date: string;
  attendance: StudentDayAttendance;
  schoolName: string;
  /** Route de la page qui affiche ce tableau (navigation par date). */
  basePath?: string;
  /**
   * Action d'enregistrement — la direction et le surveillant ont la leur.
   * Le motif est renvoyé tel quel pour ne pas le perdre au changement de statut.
   */
  saveAction?: (studentId: string, date: string, status: string, comment?: string) => Promise<SaveResult>;
  /**
   * Correction d'un pointage erroné (retour à « non pointé »). Fournie par la
   * direction seule : sans elle, recliquer un statut actif ne fait rien.
   */
  clearAction?: (studentId: string, date: string) => Promise<SaveResult>;
  /** Motif de la correction. Fourni par la direction seule ; sinon pas de colonne. */
  commentAction?: (studentId: string, date: string, comment: string) => Promise<SaveResult>;
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

  // La colonne « Motif » n'existe que pour la direction.
  const grid = commentAction ? "0.5fr 2.2fr 2.6fr 2fr" : GRID;

  const changeDate = (d: string) => {
    const sp = new URLSearchParams({ date: d });
    router.push(`${basePath}?${sp.toString()}`);
  };

  // Enregistrement optimiste : on applique la correction à l'écran, puis on
  // remonte l'erreur et on resynchronise si le serveur refuse.
  const run = (studentId: string, optimistic: () => void, save: () => Promise<SaveResult>) => {
    optimistic();
    setSavingId(studentId);
    startTransition(async () => {
      const r = await save();
      setSavingId(null);
      if (!r.ok) {
        alert(r.message);
        router.refresh();
      }
    });
  };

  const mark = (studentId: string, status: string) => {
    // Recliquer le statut déjà actif annule le pointage (correction d'une erreur).
    if (marks[studentId]?.status === status) {
      if (!clearAction) return;
      run(
        studentId,
        () => setMarks((prev) => { const next = { ...prev }; delete next[studentId]; return next; }),
        () => clearAction(studentId, date)
      );
      return;
    }
    run(
      studentId,
      () => setMarks((prev) => ({ ...prev, [studentId]: { status, comment: prev[studentId]?.comment ?? null } })),
      () => saveAction(studentId, date, status, marks[studentId]?.comment ?? undefined)
    );
  };

  const comment = (studentId: string, text: string) => {
    if (!commentAction || !marks[studentId]) return;
    const value = text.trim() || null;
    if ((marks[studentId].comment ?? null) === value) return; // rien n'a changé
    run(
      studentId,
      () => setMarks((prev) => ({ ...prev, [studentId]: { ...prev[studentId], comment: value } })),
      () => commentAction(studentId, date, text)
    );
  };

  // Compteurs sur la classe sélectionnée.
  const counts = useMemo(() => {
    const c = { present: 0, late: 0, absent: 0, justified: 0 };
    for (const s of current) {
      const st = marks[s.id]?.status;
      if (st && st in c) (c as any)[st]++;
    }
    return c;
  }, [current, marks]);

  const dateFr = new Date(date).toLocaleDateString(lang === "en" ? "en-GB" : "fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });

  const exportCsv = () => {
    const header = ["N°", "Nom et prénoms", "Sexe", "Classe", "Date", "Statut", "Motif"];
    const lines = [
      header,
      ...current.map((s, i) => [
        i + 1,
        s.name,
        s.sex === "M" ? "M" : s.sex === "F" ? "F" : "—",
        s.className,
        dateFr,
        labelOf(marks[s.id]?.status ?? "")?.fr ?? "—",
        marks[s.id]?.comment ?? "",
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
        const st = labelOf(marks[s.id]?.status ?? "");
        const sx = s.sex === "M" ? "M" : s.sex === "F" ? "F" : "—";
        const motif = escapeHtml(marks[s.id]?.comment ?? "");
        return `<tr><td class="num">${i + 1}</td><td>${escapeHtml(s.name)}</td><td class="num" style="text-align:center">${sx}</td><td style="color:${st?.color ?? "#888"};font-weight:600">${st?.fr ?? "—"}</td><td class="motif">${motif}</td></tr>`;
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
  td.mat{font-family:'Courier New',monospace;color:#444;width:96px;white-space:nowrap}
  td.motif{color:#555;font-style:italic}
  .totals{margin-top:16px;font-size:12px;display:flex;gap:18px;flex-wrap:wrap}
  .totals b{font-weight:700}
</style></head><body>
  <h1>${escapeHtml(schoolName)}</h1>
  <div class="sub">Liste de présence — ${escapeHtml(selected)} · ${dateFr} · ${current.length} élève(s)</div>
  <table><thead><tr><th>N°</th><th>Nom et prénoms</th><th>Sexe</th><th>Statut</th><th>Motif</th></tr></thead><tbody>${rows}</tbody></table>
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
        <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)", marginBottom: 14 }}>
          1. <T fr="Sélectionner la classe" en="Select the class" />
        </div>
        <ClassPicker
          classes={classes.map((c) => ({ name: c.name, count: c.list.length }))}
          selected={selected}
          onSelect={setSelected}
        />
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

        {clearAction && (
          <div style={{ padding: "8px 18px", fontSize: 11.5, color: "var(--ink-3)", background: "var(--surface-2)", borderBottom: "1px solid var(--divider)" }}>
            <T
              fr="Correction : recliquez le statut actif pour annuler le pointage (retour à « non pointé »)."
              en="Correction: click the active status again to undo the entry (back to “not marked”)."
            />
          </div>
        )}

        <div className="ek-tablewrap">
          <div style={{ minWidth: commentAction ? 860 : 640 }}>
            <div style={{ display: "grid", gridTemplateColumns: grid, padding: "10px 18px", fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em", background: "var(--surface-2)" }}>
              <div>N°</div>
              <div><T fr="Nom et prénoms" en="Full name" /></div>
              <div><T fr="Statut" en="Status" /></div>
              {commentAction && <div><T fr="Motif" en="Reason" /></div>}
            </div>
            {current.map((s, i) => {
              const cur = marks[s.id]?.status;
              return (
                <div key={s.id} style={{ display: "grid", gridTemplateColumns: grid, padding: "10px 18px", alignItems: "center", gap: 10, borderTop: "1px solid var(--divider)" }}>
                  <div style={{ color: "var(--ink-3)", fontSize: 12, fontFamily: "var(--font-display)" }}>{i + 1}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                    <span style={{ fontWeight: 600, color: "var(--ink)", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
                    <SexBadge sex={s.sex} />
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {STATUSES.map((st) => {
                      const on = cur === st.key;
                      return (
                        <button
                          key={st.key}
                          onClick={() => mark(s.id, st.key)}
                          disabled={pending && savingId === s.id}
                          title={on && clearAction ? "Cliquez pour annuler ce pointage" : undefined}
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
                  {commentAction && (
                    <CommentInput
                      key={`${s.id}:${marks[s.id]?.comment ?? ""}`}
                      value={marks[s.id]?.comment ?? ""}
                      disabled={!cur}
                      onCommit={(v) => comment(s.id, v)}
                    />
                  )}
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
            <Dot color="#16A34A" label={`${labelOf("present")!.fr} : ${counts.present}`} />
            <Dot color="#D97706" label={`${labelOf("late")!.fr} : ${counts.late}`} />
            <Dot color="#E11D48" label={`${labelOf("absent")!.fr} : ${counts.absent}`} />
            <Dot color="#4F66E8" label={`${labelOf("justified")!.fr} : ${counts.justified}`} />
          </span>
        </div>
      </div>
    </>
  );
}

const GRID = "0.5fr 2.4fr 2.6fr";

// Motif de la correction — enregistré à la sortie du champ (ou sur Entrée).
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
        width: "100%", padding: "6px 9px", borderRadius: 8, fontSize: 12.5,
        border: "1px solid var(--border)", background: disabled ? "transparent" : "var(--surface)",
        color: "var(--ink)", opacity: disabled ? 0.5 : 1,
      }}
    />
  );
}

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
