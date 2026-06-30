import { KPI, PageHeader } from "@/components/KPI";
import { MRRChart, Donut } from "@/components/Charts";
import { T } from "@/lib/i18n";
import { getOverview, getCommsFlowThisMonth, type PlanSlice } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

const PLAN_META: Record<PlanSlice["plan"], { label: string; color: string }> = {
  essentiel: { label: "Essentiel", color: "#4F66E8" },
  famille: { label: "Famille", color: "#8B5CF6" },
  premium: { label: "Premium", color: "#14B8A6" },
};

function EmptyState({ fr, en }: { fr: string; en: string }) {
  return (
    <div
      style={{
        padding: "24px 12px",
        textAlign: "center",
        fontSize: 12.5,
        color: "var(--ink-3)",
      }}
    >
      <T fr={fr} en={en} />
    </div>
  );
}

export default async function OverviewPage() {
  const [{ mrr12m, topSchools, planDistribution, kpis }, comms] = await Promise.all([
    getOverview(),
    getCommsFlowThisMonth(),
  ]);

  // Profil réel pour le bonjour personnalisé.
  let firstName = "";
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();
    firstName = (profile?.full_name ?? "").trim().split(" ")[0] ?? "";
  }

  const today = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const hasMrr = mrr12m.some((v) => v > 0);
  const planTotal = planDistribution.reduce((a, p) => a + p.count, 0);

  return (
    <div className="ek-hero" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
      <PageHeader
        eyebrow={{ fr: today, en: today }}
        title={{
          fr: firstName ? `Bonjour ${firstName}.` : "Bonjour.",
          en: firstName ? `Hi ${firstName}.` : "Hello.",
        }}
        highlight={firstName || undefined}
        sub={{
          fr: `${kpis.schools} école(s) · ${kpis.parents} parent(s) abonné(s) sur la plateforme.`,
          en: `${kpis.schools} school(s) · ${kpis.parents} paying parent(s) on the platform.`,
        }}
      />

      <div className="ek-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        <KPI icon="dollar" tint="green" label={<T fr="MRR" en="MRR" />} value={kpis.mrr} />
        <KPI icon="users" tint="blue" label={<T fr="Parents abonnés" en="Paying parents" />} value={kpis.parents} />
        <KPI icon="activity" tint="rose" label={<T fr="Churn rate" en="Churn rate" />} value={kpis.churn} />
        <KPI icon="school" tint="violet" label={<T fr="Écoles partenaires" en="Partner schools" />} value={kpis.schools} />
      </div>

      {/* Flux de données — communications école → familles ce mois */}
      <div className="ek-card" style={{ padding: 20 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
              <T fr="Flux de données" en="Data flow" />
            </div>
            <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>
              <T
                fr="Messages, bulletins et notes envoyés des écoles vers les familles ce mois-ci"
                en="Messages, report cards and grades sent from schools to families this month"
              />
            </div>
          </div>
          <div style={{ fontSize: 30, fontWeight: 700, color: "var(--brand-600)", fontFamily: "var(--font-display)", fontVariantNumeric: "tabular-nums" }}>
            {comms.total.toLocaleString("fr-FR")}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 16 }}>
          <FlowStat color="#4F66E8" value={comms.messages} label={<T fr="Messages" en="Messages" />} />
          <FlowStat color="#8B5CF6" value={comms.bulletins} label={<T fr="Bulletins & annonces" en="Reports & announcements" />} />
          <FlowStat color="#16A34A" value={comms.notes} label={<T fr="Notes" en="Grades" />} />
        </div>
      </div>

      <div className="ek-stack-md" style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 14 }}>
        <div className="ek-card" style={{ padding: 20 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
              <T fr="Revenus récurrents mensuels" en="Monthly recurring revenue" />
            </div>
            <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>
              <T fr="12 derniers mois · paiements Stripe consolidés" en="Last 12 months · Stripe payouts" />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            {hasMrr ? (
              <MRRChart values={mrr12m} w={520} h={200} />
            ) : (
              <EmptyState
                fr="Aucun revenu pour l'instant. Le graphe se remplira dès les premiers abonnements."
                en="No revenue yet. This chart fills up with the first subscriptions."
              />
            )}
          </div>
        </div>

        <div className="ek-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
              <T fr="Activité récente" en="Recent activity" />
            </div>
            <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>
              <T fr="Événements plateforme" en="Platform events" />
            </div>
          </div>
          <EmptyState fr="Aucune activité récente." en="No recent activity." />
        </div>
      </div>

      <div className="ek-stack-md" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14 }}>
        <div className="ek-card" style={{ padding: 0 }}>
          <div style={{ padding: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
              <T fr="Top écoles · revenu mensuel" en="Top schools · monthly revenue" />
            </div>
            <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>
              <T fr="Triées par MRR" en="Sorted by MRR" />
            </div>
          </div>
          <div>
            {topSchools.length === 0 ? (
              <EmptyState fr="Aucune école avec abonnement actif." en="No school with an active subscription." />
            ) : (
              topSchools.map((s, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto auto",
                    gap: 14,
                    alignItems: "center",
                    padding: "12px 18px",
                    borderTop: "1px solid var(--divider)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: "var(--surface-2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "var(--ink-2)",
                        fontFamily: "var(--font-display)",
                      }}
                    >
                      {s.name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("")}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{s.city}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-2)", fontVariantNumeric: "tabular-nums" }}>
                    {s.parents} <T fr="parents" en="parents" />
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "var(--ink)",
                      fontVariantNumeric: "tabular-nums",
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    {s.mrr}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="ek-card" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
            <T fr="Répartition des plans" en="Plan distribution" />
          </div>
          <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>
            <T fr="Parents abonnés par plan" en="Paying parents per plan" />
          </div>
          {planTotal === 0 ? (
            <EmptyState fr="Aucun abonnement actif." en="No active subscription." />
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 14 }}>
              <Donut
                segments={planDistribution.map((p) => ({ value: p.count, color: PLAN_META[p.plan].color }))}
                size={120}
              />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                {planDistribution.map((p) => (
                  <div key={p.plan} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: PLAN_META[p.plan].color }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)" }}>{PLAN_META[p.plan].label}</span>
                    <span style={{ marginLeft: "auto", fontSize: 11.5, color: "var(--ink-3)" }}>
                      {p.count} · {Math.round((p.count / planTotal) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FlowStat({ color, value, label }: { color: string; value: number; label: React.ReactNode }) {
  return (
    <div style={{ padding: "12px 14px", borderRadius: 10, background: "var(--surface-2)", display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: color }} />
        <span style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-display)", fontVariantNumeric: "tabular-nums" }}>
          {value.toLocaleString("fr-FR")}
        </span>
      </div>
      <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{label}</span>
    </div>
  );
}
