// POST /api/stripe/create-subscription
// Crée un Stripe Customer (s'il n'existe pas) + une Subscription en mode "incomplete",
// puis retourne le client_secret du PaymentIntent pour que l'app mobile complète le paiement
// via Stripe PaymentSheet.
//
// Appelé depuis l'app mobile au moment où le parent choisit son plan.

import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { priceId, plan } = (await req.json()) as { priceId?: string; plan?: string };
    if (!priceId || !plan) {
      return NextResponse.json({ error: "priceId and plan required" }, { status: 400 });
    }

    const supabase = createClient();
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return NextResponse.json({ error: "not authenticated" }, { status: 401 });
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

    // Crée la subscription en payment_behavior=default_incomplete pour récupérer
    // un PaymentIntent à confirmer côté mobile.
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
    return NextResponse.json({ error: e?.message ?? "stripe error" }, { status: 500 });
  }
}
