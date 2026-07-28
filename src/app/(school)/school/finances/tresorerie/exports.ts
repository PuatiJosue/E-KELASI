"use client";

// Exports CSV / PDF de la trésorerie et de la clôture de caisse.

import { money, escHtml, openPrint, downloadCsv, reportHead, REPORT_CSS } from "../finance-export";
import type { SchoolBranding } from "../finance-ui";
import type { TreasuryOverview, TreasuryEntry } from "@/lib/finance/treasury";
import type { CashSession } from "@/lib/finance/cash-session";
import { KIND_LABEL } from "./constants";

export function exportClosureCsv(s: CashSession) {
  const t = s.totals; if (!t) return;
  const curList = t.currencies.length ? t.currencies : ["CDF"];
  const lines: (string | number)[][] = [["Rapport de clôture de caisse", new Date(s.sessionDate).toLocaleDateString("fr-FR")], ["Clôturée le", s.closedAt ? new Date(s.closedAt).toLocaleString("fr-FR") : "", "par", s.closedBy ?? ""]];
  for (const cur of curList) {
    const tt = t.byCurrency[cur]; if (!tt) continue;
    lines.push([]);
    lines.push([`Synthèse ${cur}`]);
    lines.push(["Recettes frais scolaires", Math.round(tt.recettesScolaires)]);
    lines.push(["Recettes autres frais", Math.round(tt.recettesAutres)]);
    lines.push(["Recettes exceptionnelles", Math.round(tt.recettesExceptionnelles)]);
    lines.push(["Total recettes", Math.round(tt.totalRecettes)]);
    lines.push(["Total dépenses", Math.round(tt.totalDepenses)]);
    lines.push(["Solde", Math.round(tt.solde)]);
  }
  downloadCsv(lines, `cloture-caisse-${s.sessionDate}.csv`);
}
export function exportClosurePdf(s: CashSession, school: SchoolBranding) {
  const t = s.totals; if (!t) return;
  const curList = t.currencies.length ? t.currencies : ["CDF"];
  const synth = curList.map((cur) => { const tt = t.byCurrency[cur]; if (!tt) return ""; return `<h2>Synthèse — ${escHtml(cur)}</h2><table><tbody><tr><td>Recettes frais scolaires</td><td class="r">${money(tt.recettesScolaires, cur)}</td></tr><tr><td>Recettes autres frais</td><td class="r">${money(tt.recettesAutres, cur)}</td></tr><tr><td>Recettes exceptionnelles</td><td class="r">${money(tt.recettesExceptionnelles, cur)}</td></tr><tr><td><strong>Total des recettes</strong></td><td class="r"><strong>${money(tt.totalRecettes, cur)}</strong></td></tr><tr><td><strong>Total des dépenses</strong></td><td class="r"><strong>${money(tt.totalDepenses, cur)}</strong></td></tr></tbody><tfoot><tr><td>Solde final</td><td class="r">${money(tt.solde, cur)}</td></tr></tfoot></table>`; }).join("");
  const depRows = t.depenses.map((d) => `<tr><td>${escHtml(d.label)}</td><td>${escHtml(d.category ?? "")}</td><td class="r" style="color:#E11D48">${money(d.amount, d.currency)}</td></tr>`).join("") || '<tr><td colspan="3">—</td></tr>';
  const recRows = t.recettes.map((d) => `<tr><td>${escHtml(d.label)}</td><td>${escHtml(d.category ?? "")}</td><td class="r" style="color:#16A34A">${money(d.amount, d.currency)}</td></tr>`).join("") || '<tr><td colspan="3">—</td></tr>';
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Clôture de caisse</title><style>${REPORT_CSS}</style></head><body>${reportHead(school)}<h1>Rapport de clôture de caisse</h1>
<div class="sub">Journée du ${escHtml(new Date(s.sessionDate).toLocaleDateString("fr-FR"))} · Clôturée le ${escHtml(s.closedAt ? new Date(s.closedAt).toLocaleString("fr-FR") : "—")}${s.closedBy ? ` par ${escHtml(s.closedBy)}` : ""}</div>
${synth}
<h2>Détail des dépenses</h2><table><thead><tr><th>Libellé</th><th>Catégorie</th><th class="r">Montant</th></tr></thead><tbody>${depRows}</tbody></table>
<h2>Recettes exceptionnelles</h2><table><thead><tr><th>Libellé</th><th>Catégorie</th><th class="r">Montant</th></tr></thead><tbody>${recRows}</tbody></table>
<div class="foot">E-KELASI · rapport de clôture</div><script>window.onload=function(){window.print()}</script></body></html>`;
  openPrint(html);
}

// ── Exports ──────────────────────────────────────────────────────────
export function exportTreasuryCsv(entries: TreasuryEntry[], overview: TreasuryOverview) {
  const curList = overview.currencies.length ? overview.currencies : [overview.currency];
  const lines: (string | number)[][] = [["Journal de trésorerie"], [], ["Date", "Type", "Catégorie", "Libellé", "Montant", "Devise", "Statut"]];
  for (const e of entries) lines.push([e.entryDate, KIND_LABEL[e.kind], e.category ?? "", e.label, Math.round(e.amount), e.currency, e.cancelledAt ? `Annulée : ${e.cancelReason ?? ""}` : "Validée"]);
  for (const cur of curList) {
    const k = overview.byCurrency[cur] ?? overview.kpis;
    lines.push([]);
    lines.push([`Synthèse ${cur}`]);
    lines.push(["Recettes frais scolaires", Math.round(k.recettesScolaires)]);
    lines.push(["Recettes autres frais", Math.round(k.recettesAutres)]);
    lines.push(["Recettes exceptionnelles", Math.round(k.recettesExceptionnelles)]);
    lines.push(["Total recettes", Math.round(k.totalRecettes)]);
    lines.push(["Total dépenses", Math.round(k.totalDepenses)]);
    lines.push(["Solde", Math.round(k.solde)]);
  }
  downloadCsv(lines, "tresorerie.csv");
}

export function exportTreasuryPdf(entries: TreasuryEntry[], overview: TreasuryOverview, school: SchoolBranding, year: string) {
  const curList = overview.currencies.length ? overview.currencies : [overview.currency];
  const kc = (cur: string) => overview.byCurrency[cur] ?? overview.kpis;
  const synth = curList.map((cur) => { const k = kc(cur); return `<h2>Synthèse — ${escHtml(cur)}</h2><table><tbody><tr><td>Recettes frais scolaires</td><td class="r">${money(k.recettesScolaires, cur)}</td></tr><tr><td>Recettes autres frais</td><td class="r">${money(k.recettesAutres, cur)}</td></tr><tr><td>Recettes exceptionnelles</td><td class="r">${money(k.recettesExceptionnelles, cur)}</td></tr><tr><td><strong>Total des recettes</strong></td><td class="r"><strong>${money(k.totalRecettes, cur)}</strong></td></tr><tr><td><strong>Total des dépenses</strong></td><td class="r"><strong>${money(k.totalDepenses, cur)}</strong></td></tr><tr><td>Total des impayés</td><td class="r">${money(k.impayes, cur)}</td></tr></tbody><tfoot><tr><td>Solde de trésorerie</td><td class="r">${money(k.solde, cur)}</td></tr></tfoot></table>`; }).join("");
  const body = entries.map((e) => {
    const isRec = e.kind === "recette_exceptionnelle";
    return `<tr${e.cancelledAt ? ' style="opacity:.5"' : ""}><td>${escHtml(new Date(e.entryDate).toLocaleDateString("fr-FR"))}</td><td>${isRec ? "Recette" : "Dépense"}</td><td>${escHtml(e.category ?? "")}</td><td>${escHtml(e.label)}</td><td class="r" style="color:${isRec ? "#16A34A" : "#E11D48"}">${isRec ? "+" : "−"}${money(e.amount, e.currency)}</td></tr>`;
  }).join("");
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Trésorerie</title><style>${REPORT_CSS}</style></head><body>${reportHead(school)}<h1>Trésorerie — ${escHtml(year)}</h1>
<table><thead><tr><th>Date</th><th>Type</th><th>Catégorie</th><th>Libellé</th><th class="r">Montant</th></tr></thead><tbody>${body}</tbody></table>
${synth}
<div class="foot">E-KELASI</div><script>window.onload=function(){window.print()}</script></body></html>`;
  openPrint(html);
}

