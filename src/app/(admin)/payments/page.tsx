import { PageHeader } from "@/components/KPI";
import { Avatar } from "@/components/Avatar";
import { T } from "@/lib/i18n";
import { listPendingMobileMoney, listProcessedMobileMoney, listPendingBookPurchases } from "@/lib/db";
import { MobileMoneyActions } from "@/components/admin/MobileMoneyActions";
import { BookPurchaseActions } from "@/components/admin/BookPurchaseActions";

const PROVIDER_EMOJI: Record<string, string> = {
  orange: "🟠",
  mtn: "💛",
  airtel: "🔴",
  wave: "💙",
  mpesa: "🟢",
};

const PROVIDER_NAME: Record<string, string> = {
  orange: "Orange Money",
  mtn: "MTN MoMo",
  airtel: "Airtel Money",
  wave: "Wave",
  mpesa: "M-Pesa",
};

export default async function PaymentsPage() {
  const [pending, processed, pendingBooks] = await Promise.all([
    listPendingMobileMoney(),
    listProcessedMobileMoney(20),
    listPendingBookPurchases(),
  ]);

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
      <PageHeader
        title={{ fr: "Paiements Mobile Money", en: "Mobile Money payments" }}
        sub={{
          fr: `${pending.length} demandes en attente de validation`,
          en: `${pending.length} requests waiting for validation`,
        }}
      />

      {/* Pending */}
      <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--divider)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
            <T fr="À valider" en="To validate" />
          </div>
          <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>
            <T fr="Vérifie le numéro et la référence avant validation" en="Verify number and reference before validating" />
          </div>
        </div>

        {pending.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--ink-3)", fontSize: 12 }}>
            <T fr="Aucune demande en attente." en="No pending requests." />
          </div>
        ) : (
          <div className="ek-tablewrap">
          <div style={{ minWidth: 780 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.6fr 1fr 1fr 1fr 1.2fr 0.9fr 1fr",
                padding: "10px 18px",
                fontSize: 10.5,
                fontWeight: 700,
                color: "var(--ink-3)",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                background: "var(--surface-2)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div><T fr="Parent" en="Parent" /></div>
              <div><T fr="Plan" en="Plan" /></div>
              <div><T fr="Opérateur" en="Provider" /></div>
              <div><T fr="Montant" en="Amount" /></div>
              <div><T fr="Référence" en="Reference" /></div>
              <div><T fr="Reçu" en="Received" /></div>
              <div></div>
            </div>
            {pending.map((p, i) => (
              <div
                key={p.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.6fr 1fr 1fr 1fr 1.2fr 0.9fr 1fr",
                  padding: "12px 18px",
                  alignItems: "center",
                  fontSize: 12.5,
                  borderBottom: i < pending.length - 1 ? "1px solid var(--divider)" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Avatar name={p.parentName} size={30} />
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--ink)" }}>{p.parentName}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{p.senderPhone}</div>
                  </div>
                </div>
                <div>
                  <span className={`ek-chip ${p.plan === "premium" ? "brand" : ""}`}>
                    {p.plan === "essentiel" ? "Essentiel" : p.plan === "famille" ? "Famille" : "Premium"}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span>{PROVIDER_EMOJI[p.provider]}</span>
                  <span style={{ fontSize: 12, color: "var(--ink-2)" }}>{PROVIDER_NAME[p.provider]}</span>
                </div>
                <div style={{ fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--ink)" }}>
                  {(p.amountCents / 100).toFixed(2)} {p.currency}
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--ink-2)" }}>
                  {p.reference}
                </div>
                <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{p.createdAt}</div>
                <MobileMoneyActions id={p.id} />
              </div>
            ))}
          </div>
          </div>
        )}
      </div>

      {/* Achats de livres (Mobile Money) à valider */}
      <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--divider)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
            <T fr="Achats de livres à valider" en="Book purchases to validate" />
          </div>
          <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>
            <T fr="Mobile Money — l'accès au livre s'ouvre après validation" en="Mobile Money — book access opens after validation" />
          </div>
        </div>

        {pendingBooks.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--ink-3)", fontSize: 12 }}>
            <T fr="Aucun achat de livre en attente." en="No pending book purchases." />
          </div>
        ) : (
          <div className="ek-tablewrap">
            <div style={{ minWidth: 780 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.4fr 1.4fr 1fr 1fr 1.2fr 0.9fr 1fr",
                  padding: "10px 18px",
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: "var(--ink-3)",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  background: "var(--surface-2)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div><T fr="Parent" en="Parent" /></div>
                <div><T fr="Livre" en="Book" /></div>
                <div><T fr="Opérateur" en="Provider" /></div>
                <div><T fr="Montant" en="Amount" /></div>
                <div><T fr="Référence" en="Reference" /></div>
                <div><T fr="Reçu" en="Received" /></div>
                <div></div>
              </div>
              {pendingBooks.map((p, i) => (
                <div
                  key={p.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.4fr 1.4fr 1fr 1fr 1.2fr 0.9fr 1fr",
                    padding: "12px 18px",
                    alignItems: "center",
                    fontSize: 12.5,
                    borderBottom: i < pendingBooks.length - 1 ? "1px solid var(--divider)" : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar name={p.parentName} size={30} />
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--ink)" }}>{p.parentName}</div>
                      <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{p.senderPhone}</div>
                    </div>
                  </div>
                  <div style={{ color: "var(--ink-2)" }}>{p.bookTitle}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span>{PROVIDER_EMOJI[p.provider]}</span>
                    <span style={{ fontSize: 12, color: "var(--ink-2)" }}>{PROVIDER_NAME[p.provider]}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--ink)" }}>
                    {(p.amountCents / 100).toFixed(2)} {p.currency}
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--ink-2)" }}>{p.reference}</div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{p.createdAt}</div>
                  <BookPurchaseActions id={p.id} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Historique */}
      <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--divider)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
            <T fr="Historique récent" en="Recent history" />
          </div>
        </div>
        {processed.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "var(--ink-3)", fontSize: 12 }}>
            <T fr="Aucun paiement traité." en="No processed payments." />
          </div>
        ) : (
          <div className="ek-tablewrap">
          <div style={{ minWidth: 720 }}>
          {processed.map((p, i) => (
            <div
              key={p.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1.6fr 1fr 1fr 1fr 1.2fr 1fr",
                padding: "12px 18px",
                alignItems: "center",
                fontSize: 12.5,
                borderBottom: i < processed.length - 1 ? "1px solid var(--divider)" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar name={p.parentName} size={28} />
                <span style={{ fontWeight: 600, color: "var(--ink)" }}>{p.parentName}</span>
              </div>
              <div style={{ color: "var(--ink-2)" }}>{p.plan}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span>{PROVIDER_EMOJI[p.provider]}</span>
                <span style={{ fontSize: 11.5, color: "var(--ink-2)" }}>{PROVIDER_NAME[p.provider]}</span>
              </div>
              <div style={{ fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--ink)" }}>
                {(p.amountCents / 100).toFixed(2)} {p.currency}
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--ink-3)" }}>
                {p.reference}
              </div>
              <div>
                {p.status === "validated" && (
                  <span className="ek-chip success"><T fr="Validé" en="Validated" /></span>
                )}
                {p.status === "rejected" && (
                  <span className="ek-chip danger"><T fr="Rejeté" en="Rejected" /></span>
                )}
              </div>
            </div>
          ))}
          </div>
          </div>
        )}
      </div>
    </div>
  );
}
