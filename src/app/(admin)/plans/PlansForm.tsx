"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import { updatePlanPricesAction } from "./actions";

type Row = { id: "essentiel" | "famille" | "premium"; label: string; cents: number };

export function PlansForm({ initial }: { initial: Row[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // On édite en dollars (string) côté UI ; on convertit en cents au submit.
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(initial.map((r) => [r.id, (r.cents / 100).toFixed(2)]))
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onSave = () => {
    setError(null);
    setSuccess(null);
    const toCents = (s: string) => Math.round(parseFloat(s.replace(",", ".")) * 100);
    const e = toCents(values.essentiel);
    const f = toCents(values.famille);
    const p = toCents(values.premium);
    if (![e, f, p].every((n) => Number.isFinite(n) && n >= 1 && n <= 999900)) {
      setError("Chaque prix doit être entre $0.01 et $9999.");
      return;
    }
    startTransition(async () => {
      const res = await updatePlanPricesAction({ essentiel: e, famille: f, premium: p });
      if (res.ok) {
        setSuccess("Prix mis à jour. La table plan_prices fait foi pour Mobile Money.");
        router.refresh();
      } else {
        setError(res.message);
      }
    });
  };

  return (
    <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--divider)" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
          <T fr="Prix des plans (Mobile Money)" en="Plan prices (Mobile Money)" />
        </div>
        <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>
          <T
            fr="Source de vérité pour le trigger serveur. Toute insertion Mobile Money est recalculée depuis cette table."
            en="Source of truth for the server trigger. Any Mobile Money insert is recomputed from this table."
          />
        </div>
      </div>

      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
        {initial.map((r) => (
          <div key={r.id} className="ek-stack-md" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{r.label}</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>
                Actuel : ${(r.cents / 100).toFixed(2)} / mois
              </div>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 600 }}>$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="9999"
                value={values[r.id]}
                onChange={(e) => setValues((prev) => ({ ...prev, [r.id]: e.target.value }))}
                style={{
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid var(--border-strong)",
                  background: "var(--surface)",
                  fontSize: 14,
                  color: "var(--ink)",
                  fontFamily: "inherit",
                  width: 120,
                }}
              />
              <span style={{ fontSize: 12, color: "var(--ink-3)" }}>/ mois</span>
            </label>
          </div>
        ))}
      </div>

      <div style={{ padding: "14px 20px", borderTop: "1px solid var(--divider)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
          <T
            fr="N'oublie pas : Stripe Dashboard (nouveau Price + var Vercel) + affichage mobile (lib/plans.ts + EAS Update)."
            en="Reminder: also update Stripe Dashboard (new Price + Vercel var) + mobile display (lib/plans.ts + EAS Update)."
          />
        </div>
        <button onClick={onSave} disabled={pending} className="ek-btn ek-btn-primary" style={{ height: 36, fontSize: 13, opacity: pending ? 0.5 : 1 }}>
          <Icon name="check" size={14} stroke={2.5} />
          {pending ? "Envoi…" : "Enregistrer"}
        </button>
      </div>

      {error && (
        <div style={{ padding: "10px 20px", background: "rgba(192,58,43,0.08)", color: "var(--danger)", fontSize: 12.5, fontWeight: 600, borderTop: "1px solid var(--divider)" }}>
          ⚠ {error}
        </div>
      )}
      {success && (
        <div style={{ padding: "10px 20px", background: "var(--accent-50)", color: "var(--accent)", fontSize: 12.5, fontWeight: 600, borderTop: "1px solid var(--divider)" }}>
          ✓ {success}
        </div>
      )}
    </div>
  );
}
