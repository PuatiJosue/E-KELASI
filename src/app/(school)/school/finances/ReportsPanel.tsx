"use client";

import { useState, useMemo, useEffect } from "react";
import { Icon } from "@/components/Icon";
import { Avatar } from "@/components/Avatar";
import { SexBadge } from "@/components/SexBadge";
import { Modal, Labeled, Chip, SearchInput, Toolbar, STUDENT_STATUS, COLORS, selStyle, modalInp, iconBtn, type SchoolBranding } from "./finance-ui";
import { money, escHtml, openPrint, downloadCsv, buildInvoiceHtml, reportHead, REPORT_CSS } from "./finance-export";
import { loadClassReport, loadStudentReport } from "./actions-v2";
import { classKey } from "@/lib/classes";
import type { ClassOption } from "./FraisScolairesTab";
import type { ClassReport, StudentReport } from "@/lib/finance/reports";

export function ReportsPanel({ classes, year, school, onClose }: { classes: ClassOption[]; year: string; school: SchoolBranding; onClose: () => void }) {
  const [ckey, setCkey] = useState(classes[0] ? classKey(classes[0].className, classes[0].option) : "");
  const [report, setReport] = useState<ClassReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [studentId, setStudentId] = useState<string | null>(null);

  const chosen = classes.find((cl) => classKey(cl.className, cl.option) === ckey);

  const run = () => {
    if (!chosen) return;
    setLoading(true); setStudentId(null);
    loadClassReport(chosen.className, chosen.option, year).then((r) => { setReport(r); setLoading(false); });
  };
  useEffect(() => { run(); /* eslint-disable-next-line */ }, [ckey]);

  const q = query.trim().toLowerCase();
  const rows = useMemo(() => (report?.rows ?? []).filter((r) => !q || r.fullName.toLowerCase().includes(q) || r.matricule.toLowerCase().includes(q)), [report, q]);

  return (
    <Modal title="Rapports par classe" onClose={onClose} wide>
      <Toolbar>
        <Labeled label="Année scolaire" style={{ minWidth: 130 }}><input value={year} disabled style={{ ...modalInp, opacity: 0.7 }} /></Labeled>
        <Labeled label="Classe" style={{ minWidth: 200, flex: 1 }}>
          <select value={ckey} onChange={(e) => setCkey(e.target.value)} style={modalInp}>
            {classes.length === 0 && <option value="">— aucune classe —</option>}
            {classes.map((cl) => { const k = classKey(cl.className, cl.option); return <option key={k} value={k}>{cl.display}</option>; })}
          </select>
        </Labeled>
      </Toolbar>

      {studentId ? (
        <StudentReportView studentId={studentId} year={year} school={school} onBack={() => setStudentId(null)} />
      ) : (
        <>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <SearchInput value={query} onChange={setQuery} placeholder="Rechercher un élève…" />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => report && exportClassPdf(report, school)} disabled={!report || report.rows.length === 0} className="ek-btn ek-btn-outline" style={{ height: 38, fontSize: 12.5, opacity: !report || report.rows.length === 0 ? 0.5 : 1 }}><Icon name="file" size={14} /> PDF</button>
              <button onClick={() => report && exportClassCsv(report)} disabled={!report || report.rows.length === 0} className="ek-btn ek-btn-outline" style={{ height: 38, fontSize: 12.5, opacity: !report || report.rows.length === 0 ? 0.5 : 1 }}><Icon name="download" size={14} /> Excel</button>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 20, color: "var(--ink-3)", fontSize: 13 }}>Chargement…</div>
          ) : (
            <>
              {report && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1, background: "var(--border)", borderRadius: 10, overflow: "hidden" }}>
                  <Mini label="Attendu" value={money(report.totals.expected, report.currency)} color="var(--ink)" />
                  <Mini label="Payé" value={money(report.totals.paid, report.currency)} color={COLORS.collected} />
                  <Mini label="Solde" value={money(report.totals.remaining, report.currency)} color={COLORS.remaining} />
                </div>
              )}
              <div className="ek-tablewrap" style={{ maxHeight: "44vh", overflowY: "auto" }}>
                <div style={{ minWidth: 560 }}>
                  <div style={{ display: "grid", gridTemplateColumns: R_GRID, padding: "8px 4px", fontSize: 10, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.03em", borderBottom: "1px solid var(--divider)", position: "sticky", top: 0, background: "var(--surface)" }}>
                    <div>Élève</div><div style={{ textAlign: "right" }}>Attendu</div><div style={{ textAlign: "right" }}>Payé</div><div style={{ textAlign: "right" }}>Solde</div><div>Statut</div>
                  </div>
                  {rows.length === 0 ? (
                    <div style={{ padding: 16, color: "var(--ink-3)", fontSize: 12.5 }}>Aucun élève.</div>
                  ) : rows.map((r) => (
                    <div key={r.studentId} onClick={() => setStudentId(r.studentId)} style={{ display: "grid", gridTemplateColumns: R_GRID, padding: "9px 4px", alignItems: "center", fontSize: 12, borderBottom: "1px solid var(--divider)", cursor: "pointer" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                        <Avatar name={r.fullName} size={24} />
                        <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.fullName}</span>
                        <SexBadge sex={r.sex} size={12} />
                      </div>
                      <div style={{ textAlign: "right", fontWeight: 600 }}>{money(r.expected, report!.currency)}</div>
                      <div style={{ textAlign: "right", color: COLORS.collected, fontWeight: 600 }}>{money(r.paid, report!.currency)}</div>
                      <div style={{ textAlign: "right", color: r.remaining > 0 ? COLORS.remaining : "var(--ink-3)", fontWeight: 600 }}>{money(r.remaining, report!.currency)}</div>
                      <div><Chip {...STUDENT_STATUS[r.status]} /></div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </Modal>
  );
}

const R_GRID = "2fr 1fr 1fr 1fr 1.2fr";

function Mini({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ padding: "10px 12px", background: "var(--surface)" }}>
      <div style={{ fontSize: 9.5, color: "var(--ink-3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 800, color, marginTop: 3, fontFamily: "var(--font-display)" }}>{value}</div>
    </div>
  );
}

// ── Vue détaillée d’un élève ─────────────────────────────────────────
function StudentReportView({ studentId, year, school, onBack }: { studentId: string; year: string; school: SchoolBranding; onBack: () => void }) {
  const [rep, setRep] = useState<StudentReport | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { setLoading(true); loadStudentReport(studentId, year).then((r) => { setRep(r); setLoading(false); }); }, [studentId, year]);

  if (loading) return <div style={{ padding: 20, color: "var(--ink-3)", fontSize: 13 }}>Chargement…</div>;
  if (!rep) return <div style={{ padding: 20, color: "var(--ink-3)", fontSize: 13 }}>Élève introuvable. <button onClick={onBack} className="ek-btn ek-btn-outline" style={{ height: 30 }}>Retour</button></div>;
  const c = rep.currency;

  const reprint = (p: StudentReport["payments"][number]) => {
    const line = rep.fees.find((f) => f.label === p.feeLabel);
    openPrint(buildInvoiceHtml(school, {
      invoiceNo: p.invoiceNo ?? "", dateTime: p.paidAt, schoolYear: rep.year, studentName: rep.fullName, className: rep.classDisplay,
      feeLabel: p.feeLabel, installmentName: p.installmentName, totalAmount: line?.expected ?? p.amount, paidAmount: p.amount, currency: p.currency, cashierName: p.cashierName ?? "",
    }));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={onBack} style={iconBtn} title="Retour"><Icon name="arrowR" size={16} /></button>
        <Avatar name={rep.fullName} size={34} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{rep.fullName}</div>
          <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{rep.classDisplay} · {rep.matricule}</div>
        </div>
        <button onClick={() => exportStudentPdf(rep, school)} className="ek-btn ek-btn-outline" style={{ height: 34, fontSize: 12 }}><Icon name="file" size={13} /> PDF</button>
        <button onClick={() => exportStudentCsv(rep)} className="ek-btn ek-btn-outline" style={{ height: 34, fontSize: 12 }}><Icon name="download" size={13} /> Excel</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1, background: "var(--border)", borderRadius: 10, overflow: "hidden" }}>
        <Mini label="Attendu" value={money(rep.totals.expected, c)} color="var(--ink)" />
        <Mini label="Payé" value={money(rep.totals.paid, c)} color={COLORS.collected} />
        <Mini label="Impayés" value={money(rep.totals.remaining, c)} color={COLORS.remaining} />
      </div>

      <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink)" }}>Frais</div>
      {rep.fees.map((f) => (
        <div key={f.feeId} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, borderBottom: "1px solid var(--divider)", padding: "6px 0" }}>
          <span style={{ flex: 1, fontWeight: 600 }}>{f.label}</span>
          <span style={{ color: "var(--ink-3)" }}>{money(f.expected, c)}</span>
          <span style={{ color: COLORS.collected }}>{money(f.paid, c)}</span>
          <span style={{ color: f.remaining > 0 ? COLORS.remaining : "var(--ink-3)" }}>{money(f.remaining, c)}</span>
          <Chip {...STUDENT_STATUS[f.status]} />
        </div>
      ))}

      <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink)", marginTop: 4 }}>Historique des paiements & factures</div>
      {rep.payments.length === 0 ? (
        <div style={{ color: "var(--ink-3)", fontSize: 12.5 }}>Aucun paiement.</div>
      ) : rep.payments.map((p) => {
        const cancelled = !!p.cancelledAt;
        return (
          <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, borderBottom: "1px solid var(--divider)", padding: "7px 0", opacity: cancelled ? 0.5 : 1 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div><span style={{ fontWeight: 700, textDecoration: cancelled ? "line-through" : "none" }}>{money(p.amount, p.currency)}</span> · {p.feeLabel}{p.installmentName ? ` · ${p.installmentName}` : ""}{p.invoiceNo ? ` · N° ${p.invoiceNo}` : ""}</div>
              <div style={{ fontSize: 10.5, color: "var(--ink-3)" }}>{new Date(p.paidAt).toLocaleString("fr-FR")}{p.cashierName ? ` · ${p.cashierName}` : ""}{cancelled ? " · Annulé" : ""}</div>
            </div>
            {!cancelled && <button onClick={() => reprint(p)} title="Facture" style={iconBtn}><Icon name="file" size={14} /></button>}
          </div>
        );
      })}
    </div>
  );
}

// ── Exports ──────────────────────────────────────────────────────────
function exportClassCsv(r: ClassReport) {
  const lines: (string | number)[][] = [["Rapport de classe", r.classDisplay, r.year], [], ["Élève", "Attendu", "Payé", "Solde", "Statut"]];
  for (const s of r.rows) lines.push([s.fullName, Math.round(s.expected), Math.round(s.paid), Math.round(s.remaining), STUDENT_STATUS[s.status].label]);
  lines.push([]);
  lines.push(["Total", Math.round(r.totals.expected), Math.round(r.totals.paid), Math.round(r.totals.remaining), ""]);
  downloadCsv(lines, `rapport-${r.classDisplay}.csv`);
}
function exportClassPdf(r: ClassReport, school: SchoolBranding) {
  const c = r.currency;
  const body = r.rows.map((s) => `<tr><td>${escHtml(s.fullName)}</td><td class="r">${money(s.expected, c)}</td><td class="r" style="color:#16A34A">${money(s.paid, c)}</td><td class="r" style="color:#E11D48">${money(s.remaining, c)}</td><td>${STUDENT_STATUS[s.status].label}</td></tr>`).join("");
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Rapport ${escHtml(r.classDisplay)}</title><style>${REPORT_CSS}</style></head><body>${reportHead(school)}<h1>Rapport de classe — ${escHtml(r.classDisplay)}</h1><div class="sub">Année ${escHtml(r.year)} · ${r.rows.length} élève(s)</div><table><thead><tr><th>Élève</th><th class="r">Attendu</th><th class="r">Payé</th><th class="r">Solde</th><th>Statut</th></tr></thead><tbody>${body}</tbody><tfoot><tr><td>Total</td><td class="r">${money(r.totals.expected, c)}</td><td class="r">${money(r.totals.paid, c)}</td><td class="r">${money(r.totals.remaining, c)}</td><td></td></tr></tfoot></table><div class="foot">E-KELASI</div><script>window.onload=function(){window.print()}</script></body></html>`;
  openPrint(html);
}
function exportStudentCsv(r: StudentReport) {
  const lines: (string | number)[][] = [["Situation de", r.fullName, r.classDisplay, r.year], [], ["Frais", "Attendu", "Payé", "Solde", "Statut"]];
  for (const f of r.fees) lines.push([f.label, Math.round(f.expected), Math.round(f.paid), Math.round(f.remaining), STUDENT_STATUS[f.status].label]);
  lines.push([]);
  lines.push(["Paiement", "Montant", "Date", "N° facture", "Statut"]);
  for (const p of r.payments) lines.push([p.feeLabel, Math.round(p.amount), new Date(p.paidAt).toLocaleString("fr-FR"), p.invoiceNo ?? "", p.cancelledAt ? "Annulé" : "Validé"]);
  downloadCsv(lines, `situation-${r.fullName}.csv`);
}
function exportStudentPdf(r: StudentReport, school: SchoolBranding) {
  const c = r.currency;
  const feeBody = r.fees.map((f) => `<tr><td>${escHtml(f.label)}</td><td class="r">${money(f.expected, c)}</td><td class="r" style="color:#16A34A">${money(f.paid, c)}</td><td class="r" style="color:#E11D48">${money(f.remaining, c)}</td><td>${STUDENT_STATUS[f.status].label}</td></tr>`).join("");
  const payBody = r.payments.map((p) => `<tr${p.cancelledAt ? ' style="opacity:.5"' : ""}><td>${escHtml(new Date(p.paidAt).toLocaleString("fr-FR"))}</td><td>${escHtml(p.feeLabel)}</td><td>${escHtml(p.invoiceNo ?? "")}</td><td class="r">${money(p.amount, p.currency)}</td></tr>`).join("");
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${escHtml(r.fullName)}</title><style>${REPORT_CSS}</style></head><body>${reportHead(school)}<h1>Situation financière — ${escHtml(r.fullName)}</h1><div class="sub">${escHtml(r.classDisplay)} · ${escHtml(r.matricule)} · Année ${escHtml(r.year)}</div>
<h2>Frais</h2><table><thead><tr><th>Frais</th><th class="r">Attendu</th><th class="r">Payé</th><th class="r">Solde</th><th>Statut</th></tr></thead><tbody>${feeBody}</tbody><tfoot><tr><td>Total</td><td class="r">${money(r.totals.expected, c)}</td><td class="r">${money(r.totals.paid, c)}</td><td class="r">${money(r.totals.remaining, c)}</td><td></td></tr></tfoot></table>
<h2>Paiements & factures</h2><table><thead><tr><th>Date</th><th>Frais</th><th>N° facture</th><th class="r">Montant</th></tr></thead><tbody>${payBody || '<tr><td colspan="4">Aucun paiement.</td></tr>'}</tbody></table>
<div class="foot">E-KELASI</div><script>window.onload=function(){window.print()}</script></body></html>`;
  openPrint(html);
}
