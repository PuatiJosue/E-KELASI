"use client";

// Exports CSV / PDF de l'onglet Frais, et petits utilitaires de saisie.

import { money, escHtml, openPrint, downloadCsv, reportHead, REPORT_CSS } from "../finance-export";
import { STUDENT_STATUS, type SchoolBranding } from "../finance-ui";
import type { Fee, FeeStudentRow } from "@/lib/finance/fees";

// ── Utilitaires ──────────────────────────────────────────────────────
export function localDateTime(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

// ── Exports ──────────────────────────────────────────────────────────
export function exportFeesCsv(fees: Fee[], title: string) {
  const lines: (string | number)[][] = [[title], [], ["Frais", "Classe", "Montant total", "Élèves", "Attendu", "Encaissé", "Restant", "Recouvrement %"]];
  for (const f of fees) lines.push([f.label, f.classDisplay ?? "École entière", Math.round(f.totalAmount), f.studentCount, Math.round(f.expected), Math.round(f.collected), Math.round(f.remaining), f.recoveryPct.toFixed(0)]);
  downloadCsv(lines, `${title.toLowerCase().replace(/\s+/g, "-")}.csv`);
}
export function exportFeesPdf(fees: Fee[], c: string, school: SchoolBranding, year: string, title: string) {
  const body = fees.map((f) => `<tr><td>${escHtml(f.label)}</td><td>${escHtml(f.classDisplay ?? "École entière")}</td><td class="r">${money(f.expected, c)}</td><td class="r" style="color:#16A34A">${money(f.collected, c)}</td><td class="r" style="color:#E11D48">${money(f.remaining, c)}</td><td class="r">${f.recoveryPct.toFixed(0)} %</td></tr>`).join("");
  const exp = fees.reduce((a, f) => a + f.expected, 0), col = fees.reduce((a, f) => a + f.collected, 0);
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${escHtml(title)}</title><style>${REPORT_CSS}</style></head><body>${reportHead(school)}<h1>${escHtml(title)} — ${escHtml(year)}</h1><table><thead><tr><th>Frais</th><th>Classe</th><th class="r">Attendu</th><th class="r">Encaissé</th><th class="r">Restant</th><th class="r">Recouvrement</th></tr></thead><tbody>${body}</tbody><tfoot><tr><td colspan="2">Total</td><td class="r">${money(exp, c)}</td><td class="r">${money(col, c)}</td><td class="r">${money(Math.max(0, exp - col), c)}</td><td class="r">${exp > 0 ? ((col / exp) * 100).toFixed(0) : 0} %</td></tr></tfoot></table><div class="foot">E-KELASI</div><script>window.onload=function(){window.print()}</script></body></html>`;
  openPrint(html);
}
export function exportFeeStudentsCsv(fee: Fee, rows: FeeStudentRow[]) {
  const lines: (string | number)[][] = [[fee.label, fee.classDisplay ?? ""], [], ["Code", "Élève", "Attendu", "Payé", "Reste", "Statut"]];
  for (const s of rows) lines.push([s.matricule, s.fullName, Math.round(s.expected), Math.round(s.paid), Math.round(s.remaining), STUDENT_STATUS[s.status].label]);
  downloadCsv(lines, `frais-${fee.label}.csv`);
}
export function exportFeeStudentsPdf(fee: Fee, rows: FeeStudentRow[], school: SchoolBranding, year: string) {
  const c = fee.currency;
  const body = rows.map((s) => `<tr><td>${escHtml(s.matricule)}</td><td>${escHtml(s.fullName)}</td><td class="r">${money(s.expected, c)}</td><td class="r" style="color:#16A34A">${money(s.paid, c)}</td><td class="r" style="color:#E11D48">${money(s.remaining, c)}</td><td>${STUDENT_STATUS[s.status].label}</td></tr>`).join("");
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${escHtml(fee.label)}</title><style>${REPORT_CSS}</style></head><body>${reportHead(school)}<h1>${escHtml(fee.label)}${fee.classDisplay ? ` — ${escHtml(fee.classDisplay)}` : ""}</h1><div class="sub">Année ${escHtml(year)} · ${rows.length} élève(s)</div><table><thead><tr><th>Code</th><th>Élève</th><th class="r">Attendu</th><th class="r">Payé</th><th class="r">Reste</th><th>Statut</th></tr></thead><tbody>${body}</tbody></table><div class="foot">E-KELASI</div><script>window.onload=function(){window.print()}</script></body></html>`;
  openPrint(html);
}

