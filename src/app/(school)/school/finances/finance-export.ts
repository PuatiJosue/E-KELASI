// Helpers partagés du module Finance : formatage monétaire, impression HTML→PDF,
// export CSV (Excel). Utilitaires purs (client) — repris du module Finance v1.

export const cur = (c: string) => c;
export const money = (n: number, c = "CDF") => `${Math.round(n).toLocaleString("fr-FR")} ${cur(c)}`;

export const escHtml = (s: string) =>
  String(s ?? "").replace(/[&<>"]/g, (x) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[x]!));

// Ouvre une fenêtre imprimable (l'utilisateur choisit « Enregistrer en PDF »).
export function openPrint(html: string) {
  const w = window.open("", "_blank");
  if (!w) { alert("Autorisez les fenêtres pop-up pour générer le PDF."); return; }
  w.document.write(html);
  w.document.close();
}

// Télécharge un CSV (ouvrable dans Excel) — BOM UTF-8 pour les accents.
export function downloadCsv(lines: (string | number)[][], name: string) {
  const csv = lines.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

// En-tête HTML commun aux rapports imprimables (logo + identité école).
export function reportHead(school: { name: string; logoUrl?: string | null; city?: string | null; commune?: string | null }): string {
  const sub = [school.commune, school.city].filter(Boolean).join(", ");
  const logo = school.logoUrl ? `<img src="${escHtml(school.logoUrl)}" style="height:48px;object-fit:contain" />` : "";
  return `<div class="rhead">${logo}<div><div class="rn">${escHtml(school.name)}</div><div class="rs">${escHtml(sub)}</div></div><div class="rd">${escHtml(new Date().toLocaleString("fr-FR"))}</div></div>`;
}

export const REPORT_CSS = `*{font-family:Arial,Helvetica,sans-serif;box-sizing:border-box}body{margin:28px;color:#1a1410}h1{font-size:18px;margin:0 0 4px}h2{font-size:14px;margin:16px 0 6px;color:#1D6650}.rhead{display:flex;align-items:center;gap:14px;border-bottom:2px solid #1D6650;padding-bottom:12px;margin-bottom:14px}.rn{font-size:16px;font-weight:800}.rs{font-size:11px;color:#6b5f52}.rd{margin-left:auto;font-size:11px;color:#6b5f52}.sub{color:#6b5f52;font-size:12px;margin-bottom:10px}table{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:8px}th{background:#1D6650;color:#fff;text-align:left;padding:7px 8px;font-size:10px;text-transform:uppercase}td{padding:6px 8px;border-bottom:1px solid #ECE3D2}.r{text-align:right}tfoot td{font-weight:700;border-top:2px solid #1D6650}.foot{margin-top:22px;font-size:10px;color:#b5a99a;text-align:center}`;

// ── Facture numérique (imprimable → PDF), sans signature électronique ──
export type InvoiceSchool = {
  name: string; address?: string | null; commune?: string | null; city?: string | null;
  phone?: string | null; email?: string | null; logoUrl?: string | null;
};
export type InvoiceData = {
  invoiceNo: string;
  dateTime: string;         // ISO ; date + heure
  schoolYear: string;
  studentName: string;
  className: string;
  feeLabel: string;
  installmentName?: string | null;
  totalAmount: number;      // montant total du frais
  paidAmount: number;       // montant payé
  currency: string;
  cashierName: string;
};

export function buildInvoiceHtml(school: InvoiceSchool, inv: InvoiceData): string {
  const d = inv.dateTime ? new Date(inv.dateTime) : new Date();
  const dateFr = d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const timeFr = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const sub = [school.address, school.commune, school.city].filter(Boolean).join(", ");
  const contact = [school.phone && `Tél : ${school.phone}`, school.email && `E-mail : ${school.email}`].filter(Boolean).join(" · ");
  const no = inv.invoiceNo?.trim() || "__________";
  const logo = school.logoUrl ? `<img src="${escHtml(school.logoUrl)}" style="height:56px;object-fit:contain" />` : "";
  const rows = [
    ["Année scolaire", escHtml(inv.schoolYear)],
    ["Élève", escHtml(inv.studentName)],
    ["Classe", escHtml(inv.className)],
    ["Frais", escHtml(inv.feeLabel)],
    inv.installmentName ? ["Tranche", escHtml(inv.installmentName)] : null,
    ["Montant total du frais", money(inv.totalAmount, inv.currency)],
  ].filter(Boolean) as [string, string][];
  const infoRows = rows.map(([k, v]) => `<tr><td class="k">${k}</td><td class="v">${v}</td></tr>`).join("");
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Facture ${escHtml(no)}</title><style>
*{font-family:Arial,Helvetica,sans-serif;box-sizing:border-box}body{margin:32px;color:#1a1410}
.head{display:flex;align-items:center;gap:16px;border-bottom:2px solid #1D6650;padding-bottom:14px;margin-bottom:16px}
.head .n{font-size:20px;font-weight:800}.head .s{font-size:11px;color:#6b5f52;margin-top:2px}.head .c{font-size:11px;color:#6b5f52}
.title{margin-left:auto;text-align:right}.title .t{font-size:22px;font-weight:800;color:#1D6650;letter-spacing:.05em}.title .d{font-size:11px;color:#6b5f52;margin-top:2px}
table.info{width:100%;border-collapse:collapse;margin-bottom:16px;font-size:13px}table.info td{padding:7px 10px;border-bottom:1px solid #ECE3D2}td.k{color:#8a7c6e;width:42%}td.v{font-weight:600}
.paid{display:flex;justify-content:space-between;align-items:center;background:#F4EFE3;border-radius:10px;padding:14px 18px;margin-bottom:18px}
.paid .lbl{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#8a7c6e;font-weight:700}.paid .amt{font-size:24px;font-weight:800;color:#1D6650}
.cashier{font-size:12px;color:#6b5f52;margin-bottom:24px}
.sig{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-top:36px;padding-top:14px}
.sig .lbl{font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:#8a7c6e;font-weight:700}.sig .line{height:44px;border-bottom:1px solid #1a1410;margin-top:6px}
.mention{margin-top:26px;padding:10px 12px;background:#F4EFE3;border-radius:8px;font-size:11px;color:#6b5f52;text-align:center;font-style:italic}
</style></head><body>
<div class="head">${logo}<div><div class="n">${escHtml(school.name)}</div><div class="s">${escHtml(sub)}</div><div class="c">${escHtml(contact)}</div></div>
<div class="title"><div class="t">FACTURE</div><div class="d">N° ${escHtml(no)}</div><div class="d">${escHtml(dateFr)} · ${escHtml(timeFr)}</div></div></div>
<table class="info">${infoRows}</table>
<div class="paid"><span class="lbl">Montant payé</span><span class="amt">${money(inv.paidAmount, inv.currency)}</span></div>
<div class="cashier">Encaissé par : <strong>${escHtml(inv.cashierName || "__________")}</strong></div>
<div class="sig"><div><div class="lbl">Cachet &amp; signature (direction)</div><div class="line"></div></div><div style="text-align:right"><div class="lbl">Reçu par le parent</div><div class="line"></div></div></div>
<div class="mention">Cette facture est générée automatiquement par E-Klass et ne nécessite pas de signature électronique.</div>
<script>window.onload=function(){window.print()}</script></body></html>`;
}
