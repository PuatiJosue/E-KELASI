"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/env";
import type { Result } from "@/lib/result";


const PLAN_PRICE_CENTS: Record<string, number> = {
  essentiel: 900,
  famille: 1900,
  premium: 2900,
};

export async function validateMobileMoneyAction(id: string): Promise<Result> {
  if (!isLiveMode()) return { ok: true };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Non authentifié" };

  // 1. Récupère la demande
  const { data: payment, error: pErr } = await supabase
    .from("mobile_money_payments")
    .select("*")
    .eq("id", id)
    .single();
  if (pErr || !payment) return { ok: false, message: pErr?.message ?? "Demande introuvable" };
  if (payment.status !== "pending") return { ok: false, message: "Déjà traitée" };

  // 2. Update status → validated
  const { error: upErr } = await supabase
    .from("mobile_money_payments")
    .update({
      status: "validated",
      validated_by: user.id,
      validated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (upErr) return { ok: false, message: upErr.message };

  // 3. Crée/met à jour la subscription du parent
  const period_end = new Date();
  period_end.setMonth(period_end.getMonth() + 1);

  await supabase.from("subscriptions").upsert(
    {
      parent_id: payment.parent_id,
      stripe_customer_id: `mm_${payment.parent_id.slice(0, 8)}`,
      stripe_subscription_id: `mm_sub_${payment.id}`,
      plan: payment.plan,
      status: "active",
      amount_cents: payment.amount_cents,
      currency: payment.currency,
      current_period_start: new Date().toISOString(),
      current_period_end: period_end.toISOString(),
    },
    { onConflict: "stripe_subscription_id" }
  );

  // 4. Enregistre le payment
  await supabase.from("payments").insert({
    parent_id: payment.parent_id,
    stripe_invoice_id: `mm_inv_${payment.id}`,
    amount_cents: payment.amount_cents,
    currency: payment.currency,
    status: "paid",
    paid_at: new Date().toISOString(),
  });

  // 5. Notifie le parent
  await supabase.from("notifications").insert({
    user_id: payment.parent_id,
    kind: "billing",
    body: `Votre paiement Mobile Money a été validé. Abonnement ${payment.plan} actif.`,
  });

  revalidatePath("/payments");
  return { ok: true };
}

// ── Achats de livres (Mobile Money) ──────────────────────────────────
// Valide un achat de livre payé par Mobile Money → le parent obtient l'accès.
export async function validateBookPurchaseAction(id: string): Promise<Result> {
  if (!isLiveMode()) return { ok: true };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Non authentifié" };

  const { data: purchase } = await supabase
    .from("library_purchases")
    .select("id, parent_id, status, book_id")
    .eq("id", id)
    .single();
  if (!purchase) return { ok: false, message: "Achat introuvable" };
  if (purchase.status !== "pending") return { ok: false, message: "Déjà traité" };

  const { error } = await supabase
    .from("library_purchases")
    .update({ status: "paid", validated_by: user.id, validated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, message: error.message };

  const { data: book } = await supabase.from("library_books").select("title").eq("id", purchase.book_id).maybeSingle();
  await supabase.from("notifications").insert({
    user_id: purchase.parent_id,
    kind: "school",
    body: `📖 Paiement validé : « ${(book as any)?.title ?? "votre livre"} » est disponible dans la bibliothèque.`,
  });

  revalidatePath("/payments");
  return { ok: true };
}

export async function rejectBookPurchaseAction(id: string, reason: string): Promise<Result> {
  if (!isLiveMode()) return { ok: true };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Non authentifié" };

  const { data: purchase } = await supabase
    .from("library_purchases")
    .select("parent_id, status")
    .eq("id", id)
    .single();
  if (!purchase) return { ok: false, message: "Achat introuvable" };
  if (purchase.status !== "pending") return { ok: false, message: "Déjà traité" };

  const { error } = await supabase
    .from("library_purchases")
    .update({ status: "rejected", validated_by: user.id, validated_at: new Date().toISOString(), rejection_reason: reason })
    .eq("id", id);
  if (error) return { ok: false, message: error.message };

  await supabase.from("notifications").insert({
    user_id: purchase.parent_id,
    kind: "school",
    body: `Votre achat de livre (Mobile Money) a été refusé : ${reason}`,
  });

  revalidatePath("/payments");
  return { ok: true };
}

export async function rejectMobileMoneyAction(id: string, reason: string): Promise<Result> {
  if (!isLiveMode()) return { ok: true };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Non authentifié" };

  const { data: payment } = await supabase
    .from("mobile_money_payments")
    .select("parent_id, status")
    .eq("id", id)
    .single();
  if (!payment) return { ok: false, message: "Demande introuvable" };
  if (payment.status !== "pending") return { ok: false, message: "Déjà traitée" };

  const { error } = await supabase
    .from("mobile_money_payments")
    .update({
      status: "rejected",
      validated_by: user.id,
      validated_at: new Date().toISOString(),
      rejection_reason: reason,
    })
    .eq("id", id);
  if (error) return { ok: false, message: error.message };

  await supabase.from("notifications").insert({
    user_id: payment.parent_id,
    kind: "billing",
    body: `Votre paiement Mobile Money a été refusé : ${reason}`,
  });

  revalidatePath("/payments");
  return { ok: true };
}
