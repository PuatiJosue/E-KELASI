// Méthodes d'encaissement de l'abonnement école — sans import serveur, pour
// être partagé entre les actions et les composants client.
//
// 'card' n'est pas proposé à la saisie : il est écrit par le webhook Stripe.

export const SCHOOL_PAYMENT_METHODS = [
  { key: "mobile_money", label: "Mobile Money", hint: "Airtel Money, Orange Money, M-Pesa…" },
  { key: "bank_transfer", label: "Virement bancaire", hint: "Référence du virement" },
  { key: "cash", label: "Espèces", hint: "Remise en main propre" },
  { key: "manual", label: "Autre", hint: "À préciser dans la note" },
] as const;

export type SchoolPaymentMethod = (typeof SCHOOL_PAYMENT_METHODS)[number]["key"];

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  card: "Carte (Stripe)",
  mobile_money: "Mobile Money",
  bank_transfer: "Virement bancaire",
  cash: "Espèces",
  manual: "Autre",
};
