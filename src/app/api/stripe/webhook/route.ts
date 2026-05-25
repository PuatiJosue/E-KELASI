// Stripe webhook → écrit les évènements abonnement et paiement dans Supabase.
// Configurer côté Stripe Dashboard : Endpoint URL = https://<ton-domaine>/api/stripe/webhook
// Events à abonner : customer.subscription.*, invoice.payment_*

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function planFromMetadata(sub: Stripe.Subscription): "essentiel" | "famille" | "premium" {
  const p = (sub.metadata?.plan ?? "").toLowerCase();
  if (p === "famille" || p === "premium") return p;
  return "essentiel";
}

async function upsertSubscription(sub: Stripe.Subscription) {
  const supabase = service();
  const parentId = sub.metadata?.supabase_user_id;
  if (!parentId) return;

  const item = sub.items.data[0];
  const amountCents = item?.price?.unit_amount ?? 0;

  await supabase.from("subscriptions").upsert(
    {
      parent_id: parentId,
      stripe_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
      stripe_subscription_id: sub.id,
      plan: planFromMetadata(sub),
      status: sub.status as any,
      amount_cents: amountCents,
      currency: (item?.price?.currency ?? "eur").toUpperCase(),
      current_period_start: new Date((sub as any).current_period_start * 1000).toISOString(),
      current_period_end: new Date((sub as any).current_period_end * 1000).toISOString(),
      canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
    },
    { onConflict: "stripe_subscription_id" }
  );
}

async function recordPayment(invoice: Stripe.Invoice, status: "paid" | "failed") {
  const supabase = service();
  const subId = (invoice as any).subscription as string | null;
  if (!subId) return;
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("id, parent_id")
    .eq("stripe_subscription_id", subId)
    .single();
  if (!sub) return;

  await supabase.from("payments").insert({
    subscription_id: sub.id,
    parent_id: sub.parent_id,
    stripe_invoice_id: invoice.id,
    amount_cents: invoice.amount_paid > 0 ? invoice.amount_paid : invoice.amount_due,
    currency: invoice.currency.toUpperCase(),
    status,
    failure_reason: status === "failed" ? (invoice as any).last_finalization_error?.message ?? null : null,
    paid_at: status === "paid" ? new Date(((invoice as any).status_transitions?.paid_at ?? Date.now() / 1000) * 1000).toISOString() : null,
  });

  // Notif côté parent
  if (status === "failed") {
    await supabase.from("notifications").insert({
      user_id: sub.parent_id,
      kind: "billing",
      body: `Paiement échoué pour votre abonnement. Mettez à jour votre carte.`,
    });
  }
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !secret) {
    return NextResponse.json({ error: "missing stripe signature or secret" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const raw = await req.text();
    event = stripe().webhooks.constructEvent(raw, signature, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "invalid signature";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await upsertSubscription(event.data.object as Stripe.Subscription);
      break;
    case "invoice.payment_succeeded":
      await recordPayment(event.data.object as Stripe.Invoice, "paid");
      break;
    case "invoice.payment_failed":
      await recordPayment(event.data.object as Stripe.Invoice, "failed");
      break;
  }

  return NextResponse.json({ received: true });
}
