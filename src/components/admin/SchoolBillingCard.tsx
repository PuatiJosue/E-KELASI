"use client";

// Encaissement de l'abonnement d'une école depuis la console super admin.
// Sert surtout au règlement hors Stripe (Mobile Money, virement, espèces) :
// enregistrer le paiement réactive l'école, exactement comme le webhook Stripe.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { SCHOOL_PAYMENT_METHODS, PAYMENT_METHOD_LABEL, type SchoolPaymentMethod } from "@/lib/school-payment-methods";
import { markSchoolPaid, unmarkSchoolPaid, setSchoolSuspended } from "@/app/(admin)/schools/billing-actions";
import type { SchoolBilling } from "@/lib/db";

export function SchoolBillingCard({
  schoolId,
  status,
  billing,
}: {
  schoolId: string;
  status: string;
  billing: SchoolBilling;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const paid = billing.currentMonth;
  const suspended = status === "suspended";

  const run = (fn: () => Promise<{ ok: boolean; message?: string }>) => {
    setError(null);
    startTransition(async () => {
      const r = await fn();
      if (r.ok) {
        setForm(false);
        router.refresh();
      } else {
        setError(r.message ?? "Erreur");
      }
    });
  };

  return (
    <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--divider)", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>Abonnement E-KLASS</div>
        <span className={`ek-chip ${paid ? "success" : "warn"}`}>{paid ? "Payé" : "À régler"}</span>
        <div style={{ marginLeft: "auto", fontSize: 12, color: "var(--ink-3)" }}>
          {billing.periodFr} · tarif {billing.priceLabel}
        </div>
      </div>

      <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
        {paid ? (
          <div style={{ fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.7 }}>
            <strong style={{ color: "var(--ink)" }}>{paid.amountLabel}</strong> encaissé
            {paid.paidAtFr ? ` le ${paid.paidAtFr}` : ""} · {PAYMENT_METHOD_LABEL[paid.method] ?? paid.method}
            {paid.reference ? (
              <>
                <br />
                Référence : <code style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{paid.reference}</code>
              </>
            ) : null}
            {paid.note ? (
              <>
                <br />
                <span style={{ color: "var(--ink-3)" }}>{paid.note}</span>
              </>
            ) : null}
          </div>
        ) : (
          <div style={{ fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.6 }}>
            Aucun encaissement pour {billing.periodFr}. Enregistrez le règlement reçu hors Stripe pour réactiver l&apos;école.
          </div>
        )}

        {form ? (
          <PaymentForm
            defaultAmountCents={billing.priceCents}
            pending={pending}
            onCancel={() => { setForm(false); setError(null); }}
            onSubmit={(values) => run(() => markSchoolPaid(schoolId, values.method, {
              amountCents: values.amountCents,
              reference: values.reference,
              note: values.note,
            }))}
          />
        ) : (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => setForm(true)} disabled={pending} className="ek-btn ek-btn-primary" style={{ height: 34, fontSize: 12 }}>
              <Icon name="check" size={13} />
              {paid ? "Corriger l'encaissement" : "Enregistrer un paiement"}
            </button>
            {paid && (
              <button
                onClick={() => { if (confirm(`Annuler l'encaissement de ${billing.periodFr} ? L'école repassera « à régler ».`)) run(() => unmarkSchoolPaid(schoolId, billing.period)); }}
                disabled={pending}
                className="ek-btn ek-btn-outline"
                style={{ height: 34, fontSize: 12, color: "var(--danger)", borderColor: "var(--danger)" }}
              >
                Annuler l&apos;encaissement
              </button>
            )}
            <div style={{ flex: 1 }} />
            <button
              onClick={() => run(() => setSchoolSuspended(schoolId, !suspended))}
              disabled={pending}
              className="ek-btn ek-btn-outline"
              style={{ height: 34, fontSize: 12, color: suspended ? "var(--accent)" : "var(--danger)", borderColor: suspended ? "var(--accent)" : "var(--danger)" }}
            >
              {pending ? "…" : suspended ? "Réactiver l'accès" : "Suspendre l'accès"}
            </button>
          </div>
        )}

        {error && (
          <div style={{ padding: 10, borderRadius: 8, background: "rgba(192,58,43,0.10)", color: "var(--danger)", fontSize: 12.5, fontWeight: 600 }}>
            {error}
          </div>
        )}

        {billing.history.length > 0 && (
          <details>
            <summary style={{ fontSize: 12, color: "var(--ink-3)", cursor: "pointer", fontWeight: 600 }}>
              Historique des encaissements ({billing.history.length})
            </summary>
            <div style={{ marginTop: 8 }}>
              {billing.history.map((p) => (
                <div
                  key={p.period}
                  style={{ display: "flex", gap: 10, padding: "7px 0", borderTop: "1px solid var(--divider)", fontSize: 12, flexWrap: "wrap" }}
                >
                  <span style={{ width: 120, color: "var(--ink-2)", fontWeight: 600 }}>{p.periodFr}</span>
                  <span style={{ width: 70, color: "var(--ink)" }}>{p.amountLabel}</span>
                  <span style={{ color: "var(--ink-3)" }}>{PAYMENT_METHOD_LABEL[p.method] ?? p.method}</span>
                  {p.reference && <span style={{ color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>{p.reference}</span>}
                  <span style={{ marginLeft: "auto", color: "var(--ink-3)" }}>{p.paidAtFr ?? "—"}</span>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}

function PaymentForm({
  defaultAmountCents,
  pending,
  onCancel,
  onSubmit,
}: {
  defaultAmountCents: number;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (v: { method: SchoolPaymentMethod; amountCents: number; reference: string; note: string }) => void;
}) {
  const [method, setMethod] = useState<SchoolPaymentMethod>("mobile_money");
  const [amount, setAmount] = useState((defaultAmountCents / 100).toFixed(2));
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");

  const hint = SCHOOL_PAYMENT_METHODS.find((m) => m.key === method)?.hint ?? "";
  const amountCents = Math.round(Number(amount.replace(",", ".")) * 100);
  const validAmount = Number.isFinite(amountCents) && amountCents > 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!validAmount) return;
        onSubmit({ method, amountCents, reference, note });
      }}
      style={{ display: "flex", flexDirection: "column", gap: 10, padding: 14, borderRadius: 10, background: "var(--surface-2)" }}
    >
      <div className="ek-stack-md" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 10 }}>
        <Field label="Méthode">
          <select value={method} onChange={(e) => setMethod(e.target.value as SchoolPaymentMethod)} style={inputStyle}>
            {SCHOOL_PAYMENT_METHODS.map((m) => (
              <option key={m.key} value={m.key}>{m.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Montant reçu ($)">
          <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" required style={inputStyle} />
        </Field>
      </div>

      <Field label="Référence de la transaction">
        <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder={hint} style={inputStyle} />
      </Field>

      <Field label="Note (facultatif)">
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reçu de M. Kabongo, trésorier…" style={inputStyle} />
      </Field>

      {!validAmount && (
        <div style={{ fontSize: 11.5, color: "var(--danger)", fontWeight: 600 }}>Montant invalide.</div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" onClick={onCancel} disabled={pending} className="ek-btn ek-btn-outline" style={{ flex: 1, height: 34, fontSize: 12 }}>
          Annuler
        </button>
        <button type="submit" disabled={pending || !validAmount} className="ek-btn ek-btn-primary" style={{ flex: 1, height: 34, fontSize: 12, opacity: pending ? 0.6 : 1 }}>
          {pending ? "Enregistrement…" : "Enregistrer et activer"}
        </button>
      </div>
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "9px 11px",
  borderRadius: 9,
  border: "1px solid var(--border-strong)",
  background: "var(--surface)",
  color: "var(--ink)",
  fontSize: 12.5,
  width: "100%",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ink-2)" }}>{label}</span>
      {children}
    </label>
  );
}
