// Paiements Mobile Money en attente / traités.

import { createClient } from "@/lib/supabase/server";
import { fmtMMDate } from "./format";
import { isLiveMode } from "@/lib/env";

export type MobileMoneyRow = {
  id: string;
  parentName: string;
  senderPhone: string;
  plan: string;
  provider: string;
  amountCents: number;
  currency: string;
  reference: string;
  status: "pending" | "validated" | "rejected";
  createdAt: string;
};

export async function listPendingMobileMoney(): Promise<MobileMoneyRow[]> {
  if (!isLiveMode()) return [];
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("mobile_money_payments")
      .select("id, plan, provider, amount_cents, currency, sender_phone, reference, status, created_at, profiles!mobile_money_payments_parent_id_fkey(full_name)")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return data.map((r: any) => ({
      id: r.id,
      parentName: r.profiles?.full_name ?? "?",
      senderPhone: r.sender_phone,
      plan: r.plan,
      provider: r.provider,
      amountCents: r.amount_cents,
      currency: r.currency,
      reference: r.reference,
      status: r.status,
      createdAt: fmtMMDate(new Date(r.created_at)),
    }));
  } catch {
    return [];
  }
}

export async function listProcessedMobileMoney(limit = 20): Promise<MobileMoneyRow[]> {
  if (!isLiveMode()) return [];
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("mobile_money_payments")
      .select("id, plan, provider, amount_cents, currency, sender_phone, reference, status, validated_at, profiles!mobile_money_payments_parent_id_fkey(full_name)")
      .in("status", ["validated", "rejected"])
      .order("validated_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data.map((r: any) => ({
      id: r.id,
      parentName: r.profiles?.full_name ?? "?",
      senderPhone: r.sender_phone,
      plan: r.plan,
      provider: r.provider,
      amountCents: r.amount_cents,
      currency: r.currency,
      reference: r.reference,
      status: r.status,
      createdAt: fmtMMDate(new Date(r.validated_at)),
    }));
  } catch {
    return [];
  }
}
