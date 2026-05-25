// Stripe webhook stub.
// Verifies signature, then dispatches to subscription/payment handlers.
// Wire to real DB writes once Supabase is provisioned.

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";

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
      // TODO: upsert into `subscriptions` table
      break;
    case "invoice.payment_succeeded":
    case "invoice.payment_failed":
      // TODO: insert into `payments` table
      break;
    default:
      // ignore other events
      break;
  }

  return NextResponse.json({ received: true });
}
