// Module Finance v2 — couche données « Alertes ».
//
// Alertes calculées (jamais stockées) à afficher dans une icône de notification :
// échéance proche, impayés, solde de trésorerie faible, paiement annulé, recette
// exceptionnelle enregistrée. Reçoit les vues déjà chargées par la page pour éviter
// de recalculer les agrégats ; ne fait que 2 requêtes légères supplémentaires.

import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getMySchool } from "@/lib/school-db";
import { classLabel } from "@/lib/classes";
import { isLiveMode } from "@/lib/db";
import type { FeesOverview } from "./fees";
import type { TreasuryOverview } from "./treasury";

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export type AlertSeverity = "info" | "warning" | "critical";
export type FinanceAlert = {
  id: string;
  type: "echeance" | "impaye" | "solde" | "annulation" | "recette";
  severity: AlertSeverity;
  title: string;
  detail: string;
  date?: string | null;
};

const SEV_ORDER: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };

export async function getFinanceAlerts(
  feesScolaire: FeesOverview,
  feesAutre: FeesOverview,
  treasury: TreasuryOverview
): Promise<FinanceAlert[]> {
  if (!isLiveMode()) return mockAlerts();
  const alerts: FinanceAlert[] = [];
  const c = treasury.currency;
  const fmt = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} ${c}`;

  // Impayés (agrégats déjà calculés).
  const impayes = feesScolaire.kpis.remaining + feesAutre.kpis.remaining;
  const unpaidFees = [...feesScolaire.fees, ...feesAutre.fees].filter((f) => f.unpaidCount > 0).length;
  if (impayes > 0) {
    alerts.push({ id: "impaye", type: "impaye", severity: "warning", title: "Impayés en cours", detail: `${fmt(impayes)} restant sur ${unpaidFees} frais.` });
  }

  // Solde de trésorerie faible / négatif.
  const solde = treasury.kpis.solde;
  if (solde <= 0) {
    alerts.push({ id: "solde", type: "solde", severity: "critical", title: "Solde de trésorerie faible", detail: `Solde actuel : ${fmt(solde)}.` });
  } else if (treasury.kpis.totalRecettes > 0 && solde < treasury.kpis.totalRecettes * 0.05) {
    alerts.push({ id: "solde", type: "solde", severity: "warning", title: "Solde de trésorerie faible", detail: `Solde actuel : ${fmt(solde)}.` });
  }

  try {
    const school = await getMySchool();
    if (school) {
      const svc = service();
      const today = new Date().toISOString().slice(0, 10);
      const in7 = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
      const ago7 = new Date(Date.now() - 7 * 864e5).toISOString();

      const [{ data: insts }, { data: cancels }, { data: recettes }] = await Promise.all([
        svc.from("fee_installments").select("id, name, due_date, amount, fees(label, class_name, option)").eq("school_id", school.id).gte("due_date", today).lte("due_date", in7),
        svc.from("fee_payments").select("id, amount, cancelled_at, cancel_reason, fees(label), students(full_name)").eq("school_id", school.id).not("cancelled_at", "is", null).gte("cancelled_at", ago7).order("cancelled_at", { ascending: false }).limit(5),
        svc.from("treasury_entries").select("id, label, amount, entry_date, created_at").eq("school_id", school.id).eq("kind", "recette_exceptionnelle").is("cancelled_at", null).gte("created_at", ago7).order("created_at", { ascending: false }).limit(5),
      ]);

      for (const it of (insts ?? []) as any[]) {
        const cls = it.fees?.class_name ? ` · ${classLabel(it.fees.class_name, it.fees.option)}` : "";
        alerts.push({ id: `ech-${it.id}`, type: "echeance", severity: "warning", title: "Échéance proche", detail: `${it.fees?.label ?? "Frais"}${cls} — ${it.name}, échéance le ${new Date(it.due_date).toLocaleDateString("fr-FR")}.`, date: it.due_date });
      }
      for (const p of (cancels ?? []) as any[]) {
        alerts.push({ id: `ann-${p.id}`, type: "annulation", severity: "info", title: "Paiement annulé", detail: `${p.students?.full_name ?? "Élève"} · ${p.fees?.label ?? "Frais"} — ${p.cancel_reason ?? ""}`, date: p.cancelled_at });
      }
      for (const r of (recettes ?? []) as any[]) {
        alerts.push({ id: `rec-${r.id}`, type: "recette", severity: "info", title: "Recette exceptionnelle", detail: `${r.label} — ${fmt(Number(r.amount))}.`, date: r.entry_date });
      }
    }
  } catch { /* alertes agrégées seulement */ }

  return alerts.sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity]);
}

function mockAlerts(): FinanceAlert[] {
  return [
    { id: "solde", type: "solde", severity: "warning", title: "Solde de trésorerie faible", detail: "Solde actuel : 45 000 CDF." },
    { id: "impaye", type: "impaye", severity: "warning", title: "Impayés en cours", detail: "900 000 CDF restant sur 3 frais." },
    { id: "ech-1", type: "echeance", severity: "warning", title: "Échéance proche", detail: "Minerval · 5ème A — 2ème tranche, échéance le 15/01/2027.", date: "2027-01-15" },
    { id: "rec-1", type: "recette", severity: "info", title: "Recette exceptionnelle", detail: "Don d’un partenaire — 500 000 CDF.", date: "2026-10-03" },
  ];
}
