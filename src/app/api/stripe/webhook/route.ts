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

// Abonnement ÉCOLE (90$/mois par carte). Renvoie true si géré (= ne pas
// continuer le flux parent). Active l'école si payée, suspend sinon.
async function handleSchoolSubscription(sub: Stripe.Subscription): Promise<boolean> {
  const schoolId = sub.metadata?.school_id;
  if (!schoolId) return false;
  const supabase = service();
  const active = ["active", "trialing", "past_due"].includes(sub.status);
  await supabase.from("schools").update({ status: active ? "active" : "suspended" }).eq("id", schoolId);
  if (active) {
    const item = sub.items.data[0];
    const period = new Date().toISOString().slice(0, 7);
    await supabase.from("school_payments").upsert(
      {
        school_id: schoolId,
        period,
        amount_cents: item?.price?.unit_amount ?? 9000,
        currency: (item?.price?.currency ?? "usd").toUpperCase(),
        method: "card",
      },
      { onConflict: "school_id,period" }
    );
  }
  return true;
}

async function upsertSubscription(sub: Stripe.Subscription) {
  // Abonnement école ? → traité à part, on ne touche pas la table parents.
  if (await handleSchoolSubscription(sub)) return;

  const supabase = service();
  const parentId = sub.metadata?.supabase_user_id;
  if (!parentId) return;

  const item = sub.items.data[0];
  const amountCents = item?.price?.unit_amount ?? 0;

  // Robustesse multi-versions API Stripe : depuis ~2024, current_period_start/end
  // ont migré de l'objet Subscription vers l'item. On lit l'un ou l'autre.
  const tsToIso = (ts: unknown): string | null =>
    typeof ts === "number" && Number.isFinite(ts) ? new Date(ts * 1000).toISOString() : null;
  const periodStart = tsToIso((sub as any).current_period_start ?? (item as any)?.current_period_start);
  const periodEnd = tsToIso((sub as any).current_period_end ?? (item as any)?.current_period_end);

  await supabase.from("subscriptions").upsert(
    {
      parent_id: parentId,
      stripe_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
      stripe_subscription_id: sub.id,
      plan: planFromMetadata(sub),
      status: sub.status as any,
      amount_cents: amountCents,
      currency: (item?.price?.currency ?? "usd").toUpperCase(),
      current_period_start: periodStart,
      current_period_end: periodEnd,
      canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
    },
    { onConflict: "stripe_subscription_id" }
  );
}

async function recordPayment(invoice: Stripe.Invoice, status: "paid" | "failed") {
  const supabase = service();
  // Robustesse multi-versions : l'ID d'abonnement sur la facture a changé d'emplacement
  // selon la version API (top-level `subscription`, puis `parent.subscription_details`,
  // sinon au niveau des lignes).
  const inv = invoice as any;
  const subId: string | null =
    (typeof inv.subscription === "string" ? inv.subscription : inv.subscription?.id) ??
    inv.parent?.subscription_details?.subscription ??
    inv.lines?.data?.find((l: any) => l.subscription)?.subscription ??
    null;
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
