"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { ClassPicker } from "@/components/school/ClassPicker";
import { YearArchiveForm } from "./YearArchiveForm";
import {
  archiveYearSnapshot, loadArchiveClasses, loadArchiveStudents, loadStudentArchive,
} from "./actions";
import type { ArchiveClass, ArchiveStudentLite, StudentArchive } from "@/lib/year-archive-db";

const money = (n: number, c = "CDF") => `${Math.round(n).toLocaleString("fr-FR")} ${c === "CDF" ? "FC" : c}`;
const DECISION: Record<string, { label: string; color: string }> = {
  promotion: { label: "Passe", color: "#16A34A" },
  redoublant: { label: "Redouble", color: "#D97706" },
  graduated: { label: "Diplômé", color: "#8B5CF6" },
};

export function ArchivageManager({
  activeGrades, activeHomework, defaultYear, years,
}: {
  activeGrades: number;
  activeHomework: number;
  defaultYear: string;
  years: string[];
}) {
  const [tab, setTab] = useState<"archive" | "newyear">("archive");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border)" }}>
        {([["archive", "Archiver l'année"], ["newyear", "Nouvelle année"]] as const).map(([k, l]) => {
          const on = tab === k;
          return (
            <button key={k} onClick={() => setTab(k)} style={{ padding: "10px 14px", fontSize: 13, fontWeight: on ? 700 : 500, color: on ? "var(--brand-600)" : "var(--ink-2)", background: "none", border: "none", cursor: "pointer", borderBottom: `2px solid ${on ? "var(--brand-600)" : "transparent"}`, marginBottom: -1 }}>
              {l}
            </button>
          );
        })}
      </div>

      {tab === "archive" ? (
        <ArchiveTab defaultYear={defaultYear} years={years} />
      ) : (
        <YearArchiveForm activeGrades={activeGrades} activeHomework={activeHomework} />
      )}
    </div>
  );
}

function ArchiveTab({ defaultYear, years }: { defaultYear: string; years: string[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [year, setYear] = useState(defaultYear);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Année consultée + navigation classes → élèves → dossier.
  const [viewYear, setViewYear] = useState(years[0] ?? defaultYear);
  const [classes, setClasses] = useState<ArchiveClass[]>([]);
  const [activeClass, setActiveClass] = useState("");
  const [students, setStudents] = useState<ArchiveStudentLite[]>([]);
  const [selected, setSelected] = useState<StudentArchive | null>(null);

  useEffect(() => { loadArchiveClasses(viewYear).then(setClasses); setActiveClass(""); setStudents([]); setSelected(null); }, [viewYear]);
  const cls = activeClass && classes.some((x) => x.name === activeClass) ? activeClass : classes[0]?.name ?? "";
  useEffect(() => { if (cls) loadArchiveStudents(viewYear, cls).then(setStudents); }, [viewYear, cls]);

  const doArchive = () => {
    setMsg(null);
    if (!year.trim()) { setMsg({ ok: false, text: "Indiquez l'année." }); return; }
    start(async () => {
      const r = await archiveYearSnapshot(year.trim());
      if (r.ok) { setMsg({ ok: true, text: `✓ ${r.count} élève(s) archivé(s) pour ${year}.` }); setViewYear(year.trim()); router.refresh(); }
      else setMsg({ ok: false, text: r.message });
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Créer l'archive */}
      <div className="ek-card" style={{ padding: 18, borderLeft: "3px solid var(--brand-600)" }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Archiver l&apos;année</div>
        <p style={{ fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.5, marginBottom: 12 }}>
          Fige, par classe, le dossier de chaque élève : identité, situation financière, bulletins des 3 trimestres,
          présences et décision (passe / redouble). L&apos;archive reste consultable même après le démarrage d&apos;une nouvelle année.
        </p>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input value={year} onChange={(e) => setYear(e.target.value)} placeholder="2025-2026" style={inp} />
          <button onClick={doArchive} disabled={pending} className="ek-btn ek-btn-primary" style={{ height: 38, fontSize: 13, opacity: pending ? 0.6 : 1 }}>
            <Icon name="download" size={14} /> {pending ? "Archivage…" : "Archiver l'année"}
          </button>
        </div>
        {msg && <div style={{ marginTop: 10, fontSize: 12.5, fontWeight: 600, color: msg.ok ? "#16A34A" : "var(--danger)" }}>{msg.text}</div>}
      </div>

      {/* Consultation */}
      <div className="ek-card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, flex: 1 }}>Archives consultables</div>
          {years.length > 0 && (
            <select value={viewYear} onChange={(e) => setViewYear(e.target.value)} style={inp}>
              {[...new Set([viewYear, ...years])].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          )}
        </div>

        {classes.length === 0 ? (
          <div style={{ padding: 20, textAlign: "center", color: "var(--ink-3)", fontSize: 12.5 }}>Aucune archive pour {viewYear}. Cliquez sur « Archiver l&apos;année ».</div>
        ) : (
          <>
            <ClassPicker classes={classes} selected={cls} onSelect={(n) => { setActiveClass(n); setSelected(null); }} />
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.4fr)", gap: 14, alignItems: "start" }} className="ek-arch-grid">
              {/* Liste élèves */}
              <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--divider)", fontSize: 12.5, fontWeight: 700 }}>{cls} ({students.length})</div>
                {students.length === 0 ? (
                  <div style={{ padding: 16, color: "var(--ink-3)", fontSize: 12.5 }}>—</div>
                ) : students.map((s, i) => (
                  <button key={s.id} onClick={() => loadStudentArchive(s.id).then(setSelected)}
                    style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", padding: "9px 14px", border: "none", borderTop: i > 0 ? "1px solid var(--divider)" : "none", cursor: "pointer", fontSize: 12.5, background: selected?.id === s.id ? "var(--brand-soft)" : "transparent" }}>
                    <span style={{ flex: 1, fontWeight: 600, color: "var(--ink)" }}>{s.fullName}</span>
                    {s.decision && DECISION[s.decision] && <span style={{ fontSize: 11, fontWeight: 700, color: DECISION[s.decision].color }}>{DECISION[s.decision].label}</span>}
                  </button>
                ))}
              </div>
              {/* Dossier */}
              <ArchiveDossier archive={selected} />
            </div>
          </>
        )}
      </div>
      <style>{`@media (max-width: 900px){ .ek-arch-grid{ grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}

function ArchiveDossier({ archive }: { archive: StudentArchive | null }) {
  if (!archive) return <div className="ek-card" style={{ padding: 20, color: "var(--ink-3)", fontSize: 12.5 }}>Sélectionnez un élève pour voir son dossier annuel.</div>;
  const p = archive.payload;
  const id = p.identity;
  const dec = p.decision ? DECISION[p.decision] : null;
  const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—");
  return (
    <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--divider)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{id.fullName}</div>
          <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{id.className} · {archive.schoolYear}{id.matricule ? ` · ${id.matricule}` : ""}</div>
        </div>
        {dec && <span style={{ fontSize: 12, fontWeight: 700, color: dec.color }}>{dec.label}</span>}
        <button onClick={() => printArchive(archive)} className="ek-btn ek-btn-outline" style={{ height: 32, fontSize: 12 }}><Icon name="file" size={13} /> Imprimer / PDF</button>
      </div>
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14, fontSize: 12.5 }}>
        <Section title="Identité">
          <Field label="Sexe" value={id.sex === "M" ? "Masculin" : id.sex === "F" ? "Féminin" : "—"} />
          <Field label="Naissance" value={`${fmt(id.birthDate)}${id.birthPlace ? ` à ${id.birthPlace}` : ""}`} />
          <Field label="Père" value={id.fatherName || "—"} />
          <Field label="Mère" value={id.motherName || "—"} />
          <Field label="Tuteur" value={id.guardianName ? `${id.guardianName}${id.guardianPhone ? ` · ${id.guardianPhone}` : ""}` : "—"} />
          <Field label="Parent" value={p.parent ? `${p.parent.name}${p.parent.phone ? ` · ${p.parent.phone}` : ""}` : "—"} />
        </Section>

        <Section title="Situation financière">
          <Field label="Total dû" value={money(p.finance.totalDue, p.finance.currency)} />
          <Field label="Payé" value={money(p.finance.paid, p.finance.currency)} />
          <Field label="Reste à payer" value={money(p.finance.remaining, p.finance.currency)} strong={p.finance.remaining > 0} />
        </Section>

        <Section title="Présences">
          <Field label="Présent" value={String(p.attendance.present)} />
          <Field label="Absent" value={String(p.attendance.absent)} />
          <Field label="Retard" value={String(p.attendance.late)} />
          <Field label="Taux" value={p.attendance.rate != null ? `${p.attendance.rate}%` : "—"} />
        </Section>

        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-2)", marginBottom: 6 }}>Bulletins</div>
          {p.bulletins.length === 0 ? <div style={{ color: "var(--ink-3)" }}>Aucun bulletin encodé.</div> : (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {p.bulletins.map((b) => (
                <div key={b.trimester} style={{ flex: "1 1 140px", border: "1px solid var(--divider)", borderRadius: 8, padding: "8px 10px" }}>
                  <div style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 700 }}>Trimestre {b.trimester}</div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{b.percentage ? `${b.percentage}%` : (b.totalObtenu && b.totalMax ? `${b.totalObtenu}/${b.totalMax}` : "—")}</div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{b.mention || ""}{b.place ? ` · ${b.place}` : ""}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-2)", marginBottom: 6 }}>{title}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 6 }}>{children}</div>
    </div>
  );
}
function Field({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 10.5, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
      <div style={{ fontSize: 12.5, fontWeight: strong ? 800 : 600, color: strong ? "#E11D48" : "var(--ink)" }}>{value}</div>
    </div>
  );
}

// Impression du dossier (fenêtre → PDF).
function printArchive(a: StudentArchive) {
  const esc = (s: any) => String(s ?? "").replace(/[&<>"]/g, (x) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[x]!));
  const p = a.payload; const id = p.identity;
  const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—");
  const dec = p.decision === "promotion" ? "Passe (classe supérieure)" : p.decision === "redoublant" ? "Redouble" : p.decision === "graduated" ? "Diplômé / sortant" : "—";
  const bulls = p.bulletins.map((b) => `<tr><td>Trimestre ${b.trimester}</td><td>${esc(b.totalObtenu && b.totalMax ? `${b.totalObtenu}/${b.totalMax}` : "—")}</td><td>${esc(b.percentage ? b.percentage + "%" : "—")}</td><td>${esc(b.mention || "")}</td><td>${esc(b.place || "")}</td></tr>`).join("") || `<tr><td colspan="5">Aucun bulletin</td></tr>`;
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Dossier ${esc(id.fullName)} — ${esc(a.schoolYear)}</title><style>*{font-family:Arial,sans-serif}body{margin:28px;color:#1a1410}h1{font-size:18px;margin:0 0 2px}.sub{color:#6b5f52;font-size:12px;margin-bottom:16px}h2{font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#1D6650;border-bottom:1px solid #ECE3D2;padding-bottom:4px;margin:18px 0 8px}table{width:100%;border-collapse:collapse;font-size:12px}td,th{padding:6px 8px;border-bottom:1px solid #ECE3D2;text-align:left}.grid{display:grid;grid-template-columns:1fr 1fr;gap:4px 16px;font-size:12px}.k{color:#8a7c6e}.dec{margin-top:8px;font-weight:800;font-size:14px}</style></head><body>
<h1>${esc(id.fullName)}</h1><div class="sub">${esc(id.className)} · Année ${esc(a.schoolYear)}${id.matricule ? " · " + esc(id.matricule) : ""}</div>
<h2>Identité</h2><div class="grid"><div><span class="k">Sexe :</span> ${id.sex === "M" ? "Masculin" : id.sex === "F" ? "Féminin" : "—"}</div><div><span class="k">Naissance :</span> ${fmt(id.birthDate)}${id.birthPlace ? " à " + esc(id.birthPlace) : ""}</div><div><span class="k">Père :</span> ${esc(id.fatherName || "—")}</div><div><span class="k">Mère :</span> ${esc(id.motherName || "—")}</div><div><span class="k">Tuteur :</span> ${esc(id.guardianName || "—")}${id.guardianPhone ? " · " + esc(id.guardianPhone) : ""}</div><div><span class="k">Parent :</span> ${p.parent ? esc(p.parent.name) : "—"}</div></div>
<h2>Situation financière</h2><div class="grid"><div><span class="k">Total dû :</span> ${money(p.finance.totalDue, p.finance.currency)}</div><div><span class="k">Payé :</span> ${money(p.finance.paid, p.finance.currency)}</div><div><span class="k">Reste à payer :</span> ${money(p.finance.remaining, p.finance.currency)}</div></div>
<h2>Bulletins</h2><table><thead><tr><th>Période</th><th>Points</th><th>%</th><th>Mention</th><th>Place</th></tr></thead><tbody>${bulls}</tbody></table>
<h2>Présences</h2><div class="grid"><div><span class="k">Présent :</span> ${p.attendance.present}</div><div><span class="k">Absent :</span> ${p.attendance.absent}</div><div><span class="k">Retard :</span> ${p.attendance.late}</div><div><span class="k">Taux :</span> ${p.attendance.rate != null ? p.attendance.rate + "%" : "—"}</div></div>
<h2>Décision de fin d'année</h2><div class="dec">${esc(dec)}</div>
<script>window.onload=function(){window.print()}</script></body></html>`;
  const w = window.open("", "_blank");
  if (!w) { alert("Autorisez les fenêtres pop-up pour générer le PDF."); return; }
  w.document.write(html); w.document.close();
}

const inp: React.CSSProperties = { height: 38, padding: "0 11px", borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)", fontSize: 13, color: "var(--ink)", outline: "none" };
