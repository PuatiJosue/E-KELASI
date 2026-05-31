// E-KELASI subscription plans (parents).
// price_id pointe vers le Stripe Price ID en mode test/prod.
// À configurer sur stripe.com → Products.

export type PlanId = "essentiel" | "famille" | "premium";

export type Plan = {
  id: PlanId;
  name: { fr: string; en: string };
  price: string; // USD/mois affiché
  priceCents: number;
  features: { fr: string; en: string }[];
  highlighted?: boolean;
  stripePriceId?: string; // à remplir avec les vrais IDs
};

export const PLANS: Plan[] = [
  {
    id: "essentiel",
    name: { fr: "Essentiel", en: "Essential" },
    price: "$9/mois",
    priceCents: 900,
    features: [
      { fr: "1 enfant suivi", en: "1 child tracked" },
      { fr: "Notes & devoirs en temps réel", en: "Real-time grades & homework" },
      { fr: "Messagerie professeur ↔ parent", en: "Teacher ↔ parent messaging" },
      { fr: "Notifications push", en: "Push notifications" },
    ],
    stripePriceId: process.env.EXPO_PUBLIC_STRIPE_PRICE_ESSENTIEL ?? "",
  },
  {
    id: "famille",
    name: { fr: "Famille", en: "Family" },
    price: "$19/mois",
    priceCents: 1900,
    features: [
      { fr: "Jusqu'à 3 enfants", en: "Up to 3 children" },
      { fr: "Tout d'Essentiel", en: "Everything in Essential" },
      { fr: "Bulletins PDF mensuels", en: "Monthly PDF report cards" },
      { fr: "Analytics progression", en: "Progress analytics" },
    ],
    highlighted: true,
    stripePriceId: process.env.EXPO_PUBLIC_STRIPE_PRICE_FAMILLE ?? "",
  },
  {
    id: "premium",
    name: { fr: "Premium", en: "Premium" },
    price: "$29/mois",
    priceCents: 2900,
    features: [
      { fr: "Enfants illimités", en: "Unlimited children" },
      { fr: "Tout de Famille", en: "Everything in Family" },
      { fr: "Coaching IA hebdomadaire", en: "Weekly AI coaching" },
      { fr: "Support prioritaire 24/7", en: "Priority 24/7 support" },
    ],
    stripePriceId: process.env.EXPO_PUBLIC_STRIPE_PRICE_PREMIUM ?? "",
  },
];
