// Vue d'ensemble de la plateforme (console admin).

import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/env";
import { fmtMoneyKpi, isActiveStatus } from "./format";
import { MOCK_MRR_12M, MOCK_TOP_SCHOOLS } from "@/lib/mock";

export type PlanSlice = { plan: "essentiel" | "famille" | "premium"; count: number };

export type Overview = {
  mrr12m: number[];
  topSchools: typeof MOCK_TOP_SCHOOLS;
  planDistribution: PlanSlice[];
  kpis: {
    mrr: string;
    parents: string;
    churn: string;
    schools: string;
  };
};

const MOCK_OVERVIEW: Overview = {
  mrr12m: MOCK_MRR_12M,
  topSchools: MOCK_TOP_SCHOOLS,
  planDistribution: [
    { plan: "essentiel", count: 2820 },
    { plan: "famille", count: 1120 },
    { plan: "premium", count: 380 },
  ],
  kpis: { mrr: "$39 400", parents: "4 320", churn: "2.4%", schools: "18" },
};

// État réel par défaut quand une requête échoue en prod : du vide, jamais du faux.
const EMPTY_OVERVIEW: Overview = {
  mrr12m: new Array(12).fill(0),
  topSchools: [],
  planDistribution: [
    { plan: "essentiel", count: 0 },
    { plan: "famille", count: 0 },
    { plan: "premium", count: 0 },
  ],
  kpis: { mrr: "$0", parents: "0", churn: "0.0%", schools: "0" },
};

export async function getOverview(): Promise<Overview> {
  if (!isLiveMode()) return MOCK_OVERVIEW;
  try {
    const supabase = createClient();
    const [{ data: subs }, { count: parentsCount }, { count: schoolsCount }] = await Promise.all([
      supabase
        .from("subscriptions")
        .select("amount_cents, status, created_at, canceled_at, school_id, plan, schools(name, city)"),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "parent"),
      supabase.from("schools").select("*", { count: "exact", head: true }),
    ]);

    const rows = (subs ?? []) as any[];
    const active = rows.filter((s) => isActiveStatus(s.status));
    const mrrCents = active.reduce((sum, s) => sum + (s.amount_cents ?? 0), 0);

    // Churn approximé : abonnements résiliés / (actifs + résiliés).
    const canceled = rows.filter((s) => s.canceled_at).length;
    const churnPct = active.length + canceled > 0 ? (canceled / (active.length + canceled)) * 100 : 0;

    // Tendance MRR sur 12 mois : MRR actif estimé à la fin de chaque mois.
    const now = new Date();
    const mrr12m: number[] = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const cents = rows
        .filter(
          (s) =>
            new Date(s.created_at) <= monthEnd &&
            (!s.canceled_at || new Date(s.canceled_at) >= monthStart)
        )
        .reduce((sum, s) => sum + (s.amount_cents ?? 0), 0);
      mrr12m.push(cents / 100);
    }

    // Top écoles par MRR actif.
    const bySchool = new Map<string, { name: string; city: string; parents: number; mrrCents: number }>();
    for (const s of active) {
      if (!s.school_id) continue;
      const cur =
        bySchool.get(s.school_id) ??
        { name: s.schools?.name ?? "—", city: s.schools?.city ?? "", parents: 0, mrrCents: 0 };
      cur.parents += 1;
      cur.mrrCents += s.amount_cents ?? 0;
      bySchool.set(s.school_id, cur);
    }
    const topSchools = [...bySchool.values()]
      .sort((a, b) => b.mrrCents - a.mrrCents)
      .slice(0, 5)
      .map((x) => ({ name: x.name, city: x.city, parents: x.parents, mrr: fmtMoneyKpi(x.mrrCents), growth: "—" }));

    // Répartition réelle des plans (abonnements actifs uniquement).
    const planCounts: Record<string, number> = { essentiel: 0, famille: 0, premium: 0 };
    for (const s of active) {
      if (s.plan && s.plan in planCounts) planCounts[s.plan] += 1;
    }
    const planDistribution: PlanSlice[] = (["essentiel", "famille", "premium"] as const).map(
      (plan) => ({ plan, count: planCounts[plan] })
    );

    return {
      // Données RÉELLES — pas de repli sur la démo : une base vide affiche des zéros.
      mrr12m,
      topSchools,
      planDistribution,
      kpis: {
        mrr: fmtMoneyKpi(mrrCents),
        parents: (parentsCount ?? 0).toLocaleString("fr-FR"),
        churn: churnPct.toFixed(1) + "%",
        schools: String(schoolsCount ?? 0),
      },
    };
  } catch {
    return EMPTY_OVERVIEW;
  }
}
