// POST /api/stripe/school-checkout
// Crée une session Stripe Checkout (abonnement 90$/mois) pour l'école de la
// direction connectée. Au paiement, le webhook active l'école (metadata school_id).

import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(_req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

    const { data: staff } = await supabase
      .from("school_staff")
      .select("school_id")
      .eq("user_id", user.id)
      .eq("role", "school_admin")
      .maybeSingle();
    if (!staff) return NextResponse.json({ error: "not_school_admin" }, { status: 403 });

    const priceId = process.env.STRIPE_PRICE_ECOLE;
    if (!priceId) {
      console.error("[school-checkout] STRIPE_PRICE_ECOLE manquant");
      return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const session = await stripe().checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: user.email ?? undefined,
      success_url: `${appUrl}/school/billing?success=1`,
      cancel_url: `${appUrl}/school/billing?canceled=1`,
      subscription_data: { metadata: { school_id: staff.school_id } },
      metadata: { school_id: staff.school_id },
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    console.error("[school-checkout] error", e?.message ?? e);
    return NextResponse.json({ error: "checkout_failed" }, { status: 500 });
  }
}
