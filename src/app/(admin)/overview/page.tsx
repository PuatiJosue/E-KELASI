import { KPI, PageHeader } from "@/components/KPI";
import { Sparkline, MRRChart, Donut } from "@/components/Charts";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import { getOverview } from "@/lib/db";

const ACTIVITY = [
  { dot: "var(--accent)",  text: { fr: "École Sainte-Thérèse · upgrade Pro",       en: "Sainte-Thérèse · upgraded to Pro" },        time: "12 min" },
  { dot: "var(--info)",    text: { fr: "38 nouveaux abonnements parents",          en: "38 new parent subscriptions" },             time: "1 h" },
  { dot: "var(--brand)",   text: { fr: "Onboarding · Lycée Lumière démarré",       en: "Onboarding · Lycée Lumière started" },      time: "3 h" },
  { dot: "var(--warning)", text: { fr: "5 paiements échoués · relance auto",       en: "5 failed payments · auto-retry" },          time: "5 h" },
  { dot: "var(--danger)",  text: { fr: "Ticket P0 fermé · #1421",                  en: "P0 ticket closed · #1421" },                time: "Hier" },
];

const PLANS = [
  { label: "Essentiel", value: "2 820", pct: "65%", color: "var(--brand)" },
  { label: "Famille",   value: "1 120", pct: "26%", color: "var(--accent)" },
  { label: "Premium",   value: "380",   pct: "9%",  color: "var(--info)" },
];

export default async function OverviewPage() {
  const { mrr12m, topSchools, kpis } = await getOverview();
  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
      <PageHeader
        title={{
          fr: "Bonjour Yann. Voici votre plateforme aujourd'hui.",
          en: "Hi Yann. Here's your platform today.",
        }}
        sub={{
          fr: "24 mai 2026 · 14:32 · 18 écoles actives · 4 320 parents abonnés",
          en: "May 24, 2026 · 2:32pm · 18 active schools · 4,320 paying parents",
        }}
        right={
          <>
            <button className="ek-btn ek-btn-outline" style={{ height: 32, fontSize: 12 }}>
              <Icon name="download" size={14} />
              <T fr="Exporter rapport" en="Export report" />
            </button>
            <button className="ek-btn ek-btn-outline" style={{ height: 32, fontSize: 12 }}>
              <Icon name="calendar" size={14} />
              <T fr="Mai 2026" en="May 2026" />
              <Icon name="chevD" size={12} />
            </button>
          </>
        }
      />

      <div className="ek-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        <KPI
          label={<T fr="MRR" en="MRR" />}
          value={kpis.mrr}
          delta="+6.5%"
          sub={<T fr="vs avril · $37 000" en="vs April · $37,000" />}
          trend={<Sparkline values={[28, 30.2, 32.5, 34, 37, 39.4]} w={140} h={26} color="var(--brand)" />}
        />
        <KPI
          label={<T fr="Parents abonnés" en="Paying parents" />}
          value={kpis.parents}
          delta="+218"
          sub={<T fr="ce mois-ci" en="this month" />}
          trend={<Sparkline values={[3500, 3680, 3820, 3990, 4102, 4320]} w={140} h={26} color="var(--info)" />}
        />
        <KPI
          label={<T fr="Churn rate" en="Churn rate" />}
          value={kpis.churn}
          delta="-0.6pt"
          sub={<T fr="Moyenne 30j" en="Trailing 30d" />}
          accent="var(--accent)"
          trend={<Sparkline values={[3.5, 3.2, 3.0, 2.8, 2.6, 2.4]} w={140} h={26} color="var(--accent)" />}
        />
        <KPI
          label={<T fr="Écoles partenaires" en="Partner schools" />}
          value={kpis.schools}
          delta="+2"
          sub={<T fr="3 en onboarding" en="3 onboarding" />}
          trend={<Sparkline values={[10, 12, 13, 14, 16, 18]} w={140} h={26} color="var(--warning)" />}
        />
      </div>

      <div className="ek-stack-md" style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 14 }}>
        <div className="ek-card" style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
                <T fr="Revenus récurrents mensuels" en="Monthly recurring revenue" />
              </div>
              <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>
                <T
                  fr="12 derniers mois · paiements Stripe consolidés"
                  en="Last 12 months · Stripe payouts"
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {["7j", "30j", "12m", "Tout"].map((t, i) => (
                <button
                  key={t}
                  style={{
                    fontSize: 11.5,
                    padding: "4px 8px",
                    borderRadius: 6,
                    fontWeight: 600,
                    background: i === 2 ? "var(--surface-2)" : "transparent",
                    color: i === 2 ? "var(--ink)" : "var(--ink-3)",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <MRRChart values={mrr12m} w={520} h={200} />
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
          <div style={{ display: "flex", flexDirection: "column" }}>
            {ACTIVITY.map((e, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "8px 0", position: "relative" }}>
                <div style={{ position: "relative", width: 8, marginTop: 5, flexShrink: 0 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      background: e.dot,
                      boxShadow: `0 0 0 3px ${e.dot}22`,
                    }}
                  />
                  {i < ACTIVITY.length - 1 && (
                    <div
                      style={{
                        position: "absolute",
                        top: 12,
                        left: 3.5,
                        bottom: -12,
                        width: 1,
                        background: "var(--border)",
                      }}
                    />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, color: "var(--ink)", fontWeight: 500 }}>
                    <T fr={e.text.fr} en={e.text.en} />
                  </div>
                  <div style={{ fontSize: 10.5, color: "var(--ink-3)", marginTop: 1 }}>{e.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="ek-stack-md" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14 }}>
        <div className="ek-card" style={{ padding: 0 }}>
          <div
            style={{
              padding: 18,
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
                <T fr="Top écoles · revenu mensuel" en="Top schools · monthly revenue" />
              </div>
              <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>
                <T fr="Triées par MRR · mai 2026" en="Sorted by MRR · May 2026" />
              </div>
            </div>
            <button style={{ fontSize: 12, color: "var(--brand-600)", fontWeight: 600 }}>
              <T fr="Toutes les écoles" en="All schools" /> →
            </button>
          </div>
          <div>
            {topSchools.map((s, i) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto auto auto",
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
                    {s.name
                      .split(" ")
                      .map((w) => w[0])
                      .filter(Boolean)
                      .slice(0, 2)
                      .join("")}
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
                <span className="ek-chip success">{s.growth}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="ek-card" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
            <T fr="Répartition des plans" en="Plan distribution" />
          </div>
          <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>
            <T fr="Parents abonnés par plan" en="Paying parents per plan" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 14 }}>
            <Donut
              segments={[
                { value: 2820, color: "var(--brand)" },
                { value: 1120, color: "var(--accent)" },
                { value: 380, color: "var(--info)" },
              ]}
              size={120}
            />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
              {PLANS.map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: p.color }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)" }}>{p.label}</span>
                  <span style={{ marginLeft: "auto", fontSize: 11.5, color: "var(--ink-3)" }}>
                    {p.value} · {p.pct}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
