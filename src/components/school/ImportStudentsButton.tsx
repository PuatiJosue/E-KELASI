"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import { parseStudentRows, flagBatchDuplicates, STUDENT_CSV_TEMPLATE } from "@/lib/student-import";
import { importStudentsAction } from "@/app/(school)/school/students/actions";

export function ImportStudentsButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [doneMsg, setDoneMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const parsed = useMemo(() => parseStudentRows(text), [text]);
  const flagged = useMemo(() => flagBatchDuplicates(parsed), [parsed]);
  const isValid = (r: { fullName: string; className: string }) => !!r.fullName.trim() && !!r.className.trim();
  const toImport = useMemo(() => flagged.filter((r) => isValid(r) && !r.duplicate), [flagged]);
  const invalid = flagged.filter((r) => !isValid(r)).length;
  const batchDups = flagged.filter((r) => isValid(r) && r.duplicate).length;

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result ?? ""));
    reader.readAsText(f);
  };

  const downloadTemplate = () => {
    const blob = new Blob(["﻿" + STUDENT_CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modele-eleves.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const submit = () => {
    setError(null);
    if (toImport.length === 0) { setError("Aucune ligne valide à importer."); return; }
    start(async () => {
      const res = await importStudentsAction({ rows: toImport.map(({ duplicate, ...r }) => r) });
      if (!res.ok) { setError(res.message); return; }
      const extra = res.duplicates > 0 ? ` · ${res.duplicates} doublon(s) ignoré(s)` : "";
      setDoneMsg(`${res.inserted} élève(s) importé(s)${extra}.`);
      setText("");
      router.refresh();
    });
  };

  const close = () => { setOpen(false); setError(null); setDoneMsg(null); };

  return (
    <>
      <button onClick={() => setOpen(true)} className="ek-btn ek-btn-outline" style={{ height: 38, fontSize: 13 }}>
        <Icon name="upload" size={15} stroke={2.2} />
        <T fr="Importer une liste" en="Import a list" />
      </button>

      {open && (
        <div onClick={close} style={{ position: "fixed", inset: 0, background: "rgba(20,16,10,0.45)", display: "grid", placeItems: "center", zIndex: 100, padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} className="ek-card" style={{ width: "100%", maxWidth: 720, padding: 24, maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontSize: 18, fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>
              <T fr="Importer une liste d'élèves" en="Import a student list" />
            </h2>
            <p style={{ fontSize: 12.5, color: "var(--ink-3)", marginBottom: 14, lineHeight: 1.5 }}>
              <T
                fr="Copiez vos cellules depuis Excel/Sheets et collez-les ci-dessous, ou importez un fichier .csv. Une ligne par élève, colonnes : Nom complet · Classe · Option (facultatif) · Niveau (facultatif)."
                en="Copy cells from Excel/Sheets and paste below, or upload a .csv. One row per student, columns: Full name · Class · Option (optional) · Level (optional)."
              />
            </p>

            <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
              <button onClick={() => fileRef.current?.click()} className="ek-btn ek-btn-outline" style={{ height: 34, fontSize: 12.5 }}>
                <Icon name="file" size={14} /> <T fr="Choisir un fichier .csv" en="Choose a .csv file" />
              </button>
              <input ref={fileRef} type="file" accept=".csv,text/csv,text/plain" onChange={onFile} style={{ display: "none" }} />
              <button onClick={downloadTemplate} className="ek-btn ek-btn-outline" style={{ height: 34, fontSize: 12.5 }}>
                <Icon name="download" size={14} /> <T fr="Télécharger le modèle" en="Download template" />
              </button>
              {text && (
                <button onClick={() => setText("")} className="ek-btn ek-btn-ghost" style={{ height: 34, fontSize: 12.5 }}>
                  <T fr="Vider" en="Clear" />
                </button>
              )}
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={"Mamadou Ndoye; 5e année primaire\nAwa Sow; 1re année des humanités; Sciences\n…"}
              rows={6}
              style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--surface)", color: "var(--ink)", fontSize: 13, fontFamily: "var(--font-mono)", outline: "none", resize: "vertical" }}
            />

            {parsed.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink)", marginBottom: 6 }}>
                  <T fr={`Aperçu — ${toImport.length} à importer`} en={`Preview — ${toImport.length} to import`} />
                  {batchDups > 0 && <span style={{ color: "var(--warning)", fontWeight: 600 }}> · {batchDups} <T fr="doublon(s)" en="duplicate(s)" /></span>}
                  {invalid > 0 && <span style={{ color: "var(--danger)", fontWeight: 600 }}> · {invalid} <T fr="invalide(s)" en="invalid" /></span>}
                </div>
                <div className="ek-tablewrap" style={{ border: "1px solid var(--border)", borderRadius: 10, maxHeight: 240, overflowY: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                    <thead>
                      <tr style={{ background: "var(--surface-2)" }}>
                        {["Nom", "Classe", "Option", "Niveau", ""].map((h, hi) => (
                          <th key={hi} style={{ textAlign: "left", padding: "8px 10px", color: "var(--ink-3)", fontWeight: 700, position: "sticky", top: 0, background: "var(--surface-2)" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {flagged.slice(0, 100).map((r, i) => {
                        const ok = isValid(r);
                        const dimmed = !ok || r.duplicate;
                        return (
                          <tr key={i} style={{ borderTop: "1px solid var(--divider)", opacity: dimmed ? 0.5 : 1 }}>
                            <td style={{ padding: "7px 10px", color: "var(--ink)" }}>{r.fullName || <span style={{ color: "var(--danger)" }}>—</span>}</td>
                            <td style={{ padding: "7px 10px", color: "var(--ink)" }}>{r.className || <span style={{ color: "var(--danger)" }}>manque</span>}</td>
                            <td style={{ padding: "7px 10px", color: "var(--ink-2)" }}>{r.option || "—"}</td>
                            <td style={{ padding: "7px 10px", color: "var(--ink-2)" }}>{r.gradeLevel || r.className || "—"}</td>
                            <td style={{ padding: "7px 10px", textAlign: "right" }}>
                              {!ok ? (
                                <span className="ek-chip danger" style={{ fontSize: 10.5 }}><T fr="invalide" en="invalid" /></span>
                              ) : r.duplicate ? (
                                <span className="ek-chip warn" style={{ fontSize: 10.5 }}><T fr="doublon" en="duplicate" /></span>
                              ) : null}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 6 }}>
                  <T fr="Les élèves déjà présents dans l'école seront aussi ignorés automatiquement." en="Students already in the school are skipped automatically too." />
                </div>
              </div>
            )}

            {error && <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: "rgba(225,29,72,0.10)", color: "var(--danger)", fontSize: 12.5, fontWeight: 600 }}>{error}</div>}
            {doneMsg && <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: "var(--accent-50)", color: "var(--accent)", fontSize: 12.5, fontWeight: 600 }}>✓ {doneMsg}</div>}

            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              <button type="button" onClick={close} className="ek-btn ek-btn-outline" style={{ flex: 1 }}>
                <T fr="Fermer" en="Close" />
              </button>
              <button type="button" onClick={submit} disabled={pending || toImport.length === 0} className="ek-btn ek-btn-primary" style={{ flex: 1, opacity: pending || toImport.length === 0 ? 0.6 : 1 }}>
                {pending ? "Import…" : <T fr={`Importer ${toImport.length} élève(s)`} en={`Import ${toImport.length}`} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
