import { KPI, PageHeader } from "@/components/KPI";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import { listRecentPayments, getOverview } from "@/lib/db";

export default async function BillingPage() {
  const [payments, overview] = await Promise.all([listRecentPayments(), getOverview()]);
  const paid = payments.filter((p) => p.status === "paid").length;
  const failed = payments.filter((p) => p.status === "failed").length;

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={{ fr: "Abonnements & paiements", en: "Subscriptions & billing" }}
        sub={{ fr: "Paiements consolidés via Stripe.", en: "Payments consolidated via Stripe." }}
      />

      <div className="ek-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        <KPI label={<T fr="MRR" en="MRR" />} value={overview.kpis.mrr} />
        <KPI label={<T fr="Parents abonnés" en="Paying parents" />} value={overview.kpis.parents} />
        <KPI label={<T fr="Paiements réussis" en="Successful payments" />} value={String(paid)} sub={<T fr="récents" en="recent" />} />
        <KPI
          label={<T fr="Échecs paiement" en="Failed payments" />}
          value={String(failed)}
          accent="var(--warning)"
          sub={<T fr="récents" en="recent" />}
        />
      </div>

      <div className="ek-card" style={{ padding: 0 }}>
        <div style={{ padding: 18, borderBottom: "1px solid var(--divider)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
            <T fr="Paiements récents" en="Recent payments" />
          </div>
          <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>
            <T fr="50 dernières transactions" en="Last 50 transactions" />
          </div>
        </div>
        {payments.length === 0 ? (
          <div style={{ padding: "28px 18px", textAlign: "center", fontSize: 12.5, color: "var(--ink-3)" }}>
            <T fr="Aucun paiement pour l'instant." en="No payment yet." />
          </div>
        ) : (
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
                  <div style={{ fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
                    {tx.amount}
                  </div>
                  <div>
                    {tx.status === "paid" && (
                      <span className="ek-chip success">
                        <Icon name="check" size={10} stroke={3} /> <T fr="Réussi" en="Paid" />
                      </span>
                    )}
                    {tx.status === "failed" && <span className="ek-chip danger"><T fr="Échec" en="Failed" /></span>}
                    {tx.status === "refunded" && <span className="ek-chip">Remb.</span>}
                  </div>
                  <div style={{ color: "var(--ink-3)", textAlign: "right", fontSize: 11.5 }}>{tx.date}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
