import { PageHeader } from "@/components/KPI";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/env";
import { PlansForm } from "./PlansForm";

const FALLBACK = [
  { id: "essentiel", label: "Essentiel", cents: 900 },
  { id: "famille",   label: "Famille",   cents: 1900 },
  { id: "premium",   label: "Premium",   cents: 2900 },
] as const;

async function fetchPrices() {
  if (!isLiveMode()) return [...FALLBACK];
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("plan_prices")
      .select("plan, amount_cents")
      .in("plan", ["essentiel", "famille", "premium"]);
    if (!data || data.length === 0) return [...FALLBACK];

    const byPlan = new Map(data.map((r) => [r.plan, r.amount_cents]));
    return FALLBACK.map((f) => ({ ...f, cents: byPlan.get(f.id) ?? f.cents }));
  } catch {
    return [...FALLBACK];
  }
}

export default async function PlansPage() {
  const rows = await fetchPrices();

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={{ fr: "Plans & tarifs", en: "Plans & pricing" }}
        sub={{
          fr: "Gère les prix des abonnements parents — applicable directement au Mobile Money.",
          en: "Manage parent subscription prices — applies immediately for Mobile Money.",
        }}
      />
      <PlansForm initial={rows.map((r) => ({ id: r.id, label: r.label, cents: r.cents }))} />
    </div>
  );
}
