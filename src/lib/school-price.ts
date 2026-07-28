// Prix de l'abonnement E-KLASS facturé à l'école — source unique de vérité.
//
// Le montant est construit ici (et envoyé à Stripe via `price_data`), plutôt que
// pointé sur un Price créé dans le dashboard Stripe : changer le tarif ne demande
// donc aucune manipulation côté Stripe.
//
// ⚠️ Mode test : le tarif est actuellement à 5 $/mois pour valider le flux de
// paiement de bout en bout. Repasser à 9000 (90 $) avant le lancement, ou définir
// SCHOOL_PRICE_CENTS=9000 dans l'env (Vercel) sans toucher au code.

const DEFAULT_CENTS = 500; // 5,00 $ — tarif de test

export function schoolPriceCents(): number {
  const raw = Number(process.env.SCHOOL_PRICE_CENTS);
  if (Number.isFinite(raw) && raw >= 50) return Math.round(raw);
  return DEFAULT_CENTS;
}

export const SCHOOL_PRICE_CURRENCY = "usd";

/** « 5 $ » ou « 12,50 $ » — libellé affiché dans les consoles. */
export function schoolPriceLabel(cents: number = schoolPriceCents()): string {
  const amount = cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2).replace(".", ",");
  return `${amount} $`;
}
