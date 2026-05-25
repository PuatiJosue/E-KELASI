// Server-side Stripe stub. Real keys live in env vars.
// Replace with actual SDK usage once env is provisioned.
import Stripe from "stripe";

let _client: Stripe | null = null;

export function stripe(): Stripe {
  if (_client) return _client;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  _client = new Stripe(key, { apiVersion: "2024-09-30.acacia" });
  return _client;
}
