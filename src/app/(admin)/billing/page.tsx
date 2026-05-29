import { KPI, PageHeader } from "@/components/KPI";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import { listRecentPayments } from "@/lib/db";

const COHORTS = [
  { m: "Janv 2026", v: 0.96 },
  { m: "Févr 2026", v: 0.94 },
  { m: "Mars 2026", v: 0.92 },
  { m: "Avr 2026",  v: 0.95 },
  { m: "Mai 2026",  v: 0.97 },
];

export default async function BillingPage() {
  const payments = await listRecentPayments();
  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={{ fr: "Abonnements & paiements", en: "Subscriptions & billing" }}
        sub={{
          fr: "Synchronisé avec Stripe · dernière mise à jour il y a 2 min",
          en: "Synced with Stripe · last update 2 min ago",
        }}
        right={
          <button className="ek-btn ek-btn-outline" style={{ height: 32, fontSize: 12 }}>
            <Icon name="refresh" size={13} /> <T fr="Synchroniser" en="Sync now" />
          </button>
        }
      />

      <div className="ek-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        <KPI label={<T fr="MRR" en="MRR" />} value="€39 400" delta="+6.5%" sub="Stripe" />
        <KPI label={<T fr="ARR" en="ARR" />} value="€472 800" delta="+5.8%" sub={<T fr="annualisé" en="annualized" />} />
        <KPI label={<T fr="ARPU" en="ARPU" />} value="€9.12" delta="+0.4" sub={<T fr="par parent" en="per parent" />} />
        <KPI
          label={<T fr="Échecs paiement" en="Failed payments" />}
          value="14"
          delta="-3"
          accent="var(--warning)"
          sub={<T fr="à relancer" en="to retry" />}
        />
      </div>

      <div className="ek-stack-md" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14 }}>
        <div className="ek-card" style={{ padding: 0 }}>
          <div
            style={{
              padding: 18,
              borderBottom: "1px solid var(--divider)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
                <T fr="Paiements récents" en="Recent payments" />
              </div>
              <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>
                <T
                  fr="Stripe Billing · 50 dernières transactions"
                  en="Stripe Billing · last 50 transactions"
                />
              </div>
            </div>
            <button style={{ fontSize: 12, color: "var(--brand-600)", fontWeight: 600 }}>
              <T fr="Voir tout" en="View all" /> →
            </button>
          </div>
          <div className="ek-tablewrap">
          <div style={{ minWidth: 520 }}>
          {payments.map((tx, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "1.4fr 1fr 0.8fr 0.9fr 1fr",
                padding: "12px 18px",
                alignItems: "center",
                fontSize: 12.5,
                borderBottom: i < payments.length - 1 ? "1px solid var(--divider)" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar name={tx.parent} size={28} />
                <span style={{ fontWeight: 600, color: "var(--ink)" }}>{tx.parent}</span>
              </div>
              <div>
                <span className={`ek-chip ${tx.plan === "Premium" ? "brand" : ""}`}>{tx.plan}</span>
              </div>
              <div
                style={{
                  fontWeight: 700,
                  fontFamily: "var(--font-display)",
                  color: "var(--ink)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {tx.amount}
              </div>
              <div>
                {tx.status === "paid" && (
                  <span className="ek-chip success">
                    <Icon name="check" size={10} stroke={3} /> <T fr="Réussi" en="Paid" />
                  </span>
                )}
                {tx.status === "failed" && (
                  <span className="ek-chip danger">
                    <T fr="Échec" en="Failed" />
                  </span>
                )}
                {tx.status === "refunded" && <span className="ek-chip">Remb.</span>}
              </div>
              <div style={{ color: "var(--ink-3)", textAlign: "right", fontSize: 11.5 }}>{tx.date}</div>
            </div>
          ))}
          </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="ek-card" style={{ padding: 20 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
                  <T fr="Churn par cohorte" en="Cohort churn" />
                </div>
                <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>
                  <T fr="Rétention après 6 mois" en="Retention after 6 months" />
                </div>
              </div>
              <span className="ek-chip success">94.2%</span>
            </div>
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
              {COHORTS.map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 64, fontSize: 11, color: "var(--ink-3)" }}>{r.m}</span>
                  <div
                    style={{
                      flex: 1,
                      height: 8,
                      borderRadius: 4,
                      background: "var(--surface-2)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${r.v * 100}%`,
                        background: "var(--accent)",
                        borderRadius: 4,
                      }}
                    />
                  </div>
                  <span
                    style={{
                      width: 38,
                      fontSize: 11,
                      color: "var(--ink-2)",
                      fontWeight: 600,
                      fontVariantNumeric: "tabular-nums",
                      textAlign: "right",
                    }}
                  >
                    {(r.v * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="ek-card" style={{ padding: 18, borderLeft: "3px solid var(--warning)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Icon name="zap" size={16} style={{ color: "var(--warning)" }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
                <T fr="14 paiements à relancer" en="14 payments to retry" />
              </span>
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-2)", marginTop: 6, lineHeight: 1.5 }}>
              <T
                fr="3 cartes expirées, 8 fonds insuffisants, 3 erreurs réseau. La relance auto Stripe est en cours."
                en="3 expired cards, 8 insufficient funds, 3 network errors. Stripe smart retries are running."
              />
            </div>
            <button
              className="ek-btn ek-btn-outline"
              style={{ marginTop: 12, height: 32, fontSize: 12 }}
            >
              <T fr="Voir le détail" en="Open details" /> →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
