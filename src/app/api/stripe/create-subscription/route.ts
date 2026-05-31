// POST /api/stripe/create-subscription
// Crée un Stripe Customer (s'il n'existe pas) + une Subscription en mode "incomplete",
// puis retourne le client_secret du PaymentIntent pour que l'app mobile complète le paiement
// via Stripe PaymentSheet.
//
// Sécurité : le client envoie SEULEMENT le `plan` (essentiel/famille/premium). Le priceId
// Stripe est dérivé côté serveur depuis l'env — un client malveillant ne peut pas s'abonner
// à un priceId arbitraire (ex. €0).

import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { ratelimit } from "@/lib/rate-limit";

type Plan = "essentiel" | "famille" | "premium";

function priceIdFor(plan: Plan): string | null {
  switch (plan) {
    case "essentiel": return process.env.STRIPE_PRICE_ESSENTIEL ?? null;
    case "famille":   return process.env.STRIPE_PRICE_FAMILLE   ?? null;
    case "premium":   return process.env.STRIPE_PRICE_PREMIUM   ?? null;
  }
}

export async function POST(req: NextRequest) {
  try {
    // Rate limit par IP — protège contre l'abus (création de subscriptions en boucle).
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
    if (!ratelimit(`subscribe:${ip}`, { limit: 10, windowMs: 60_000 })) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }

    const body = (await req.json().catch(() => ({}))) as { plan?: string };
    const plan = body.plan as Plan | undefined;
    if (!plan || !["essentiel", "famille", "premium"].includes(plan)) {
      return NextResponse.json({ error: "invalid_plan" }, { status: 400 });
    }
    const priceId = priceIdFor(plan);
    if (!priceId) {
      console.error("[create-subscription] priceId env var missing for plan", plan);
      return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
    }

    const supabase = createClient();
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }

    // Récupère ou crée le Stripe Customer
    const { data: existing } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("parent_id", user.id)
      .limit(1)
      .maybeSingle();

    let customerId = existing?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe().customers.create({
        email: user.email ?? undefined,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
    }

    // Subscription en payment_behavior=default_incomplete pour récupérer un PaymentIntent.
    const subscription = await stripe().subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      expand: ["latest_invoice.payment_intent"],
      trial_period_days: 14,
      metadata: { supabase_user_id: user.id, plan },
    });

    const invoice = subscription.latest_invoice as any;
    const paymentIntent = invoice?.payment_intent;

    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret: paymentIntent?.client_secret ?? null,
      customerId,
      ephemeralKey: null,
    });
  } catch (e: any) {
    // Ne fuit JAMAIS le message Stripe brut au client : logue côté serveur, renvoie générique.
    console.error("[create-subscription] error", e?.message ?? e);
    return NextResponse.json({ error: "subscription_failed" }, { status: 500 });
  }
}
