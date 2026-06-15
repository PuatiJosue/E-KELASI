import { PageHeader } from "@/components/KPI";
import { getSchoolFeeSummary } from "@/lib/finance-db";
import { FinanceBrowser } from "./FinanceBrowser";

export default async function SchoolFinances() {
  const rows = await getSchoolFeeSummary();

  // Totaux école par devise + nombre d'élèves ayant payé.
  const totals: Record<string, number> = {};
  let paidStudents = 0;
  for (const r of rows) {
    if (r.count > 0) paidStudents++;
    for (const t of r.totals) totals[t.currency] = (totals[t.currency] ?? 0) + t.total;
  }
  const totalLabel = Object.entries(totals)
    .map(([c, t]) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} ${c === "CDF" ? "FC" : c}`)
    .join(" + ");

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={{ fr: "Finances", en: "Finances" }}
        sub={{
          fr: `${paidStudents} élève(s) ont payé${totalLabel ? ` · ${totalLabel} encaissés` : ""}`,
          en: `${paidStudents} student(s) paid${totalLabel ? ` · ${totalLabel} collected` : ""}`,
        }}
      />

      <div style={{ fontSize: 12, color: "var(--ink-3)", lineHeight: 1.5 }}>
        Suivi des frais scolaires / minerval. Cliquez sur un élève pour enregistrer un paiement
        (montant, commentaire, photo du reçu) et voir son historique.
      </div>

      <FinanceBrowser rows={rows} />
    </div>
  );
}
