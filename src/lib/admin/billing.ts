// Derniers paiements des familles (console admin).

import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/env";
import { fmtMoney, fmtDateTime, planLabel } from "./format";
import { MOCK_PAYMENTS, type PaymentRow } from "@/lib/mock";

export async function listRecentPayments(): Promise<PaymentRow[]> {
  if (!isLiveMode()) return MOCK_PAYMENTS;
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("payments")
      .select("amount_cents, currency, status, paid_at, created_at, profiles(full_name), subscriptions(plan)")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error || !data) return [];
    return data.map((p: any) => ({
      parent: p.profiles?.full_name ?? "—",
      plan: planLabel(p.subscriptions?.plan ?? "essentiel"),
      amount: fmtMoney(p.amount_cents ?? 0, p.currency),
      status: (["paid", "failed", "refunded"].includes(p.status) ? p.status : "paid") as PaymentRow["status"],
      date: fmtDateTime(new Date(p.paid_at ?? p.created_at)),
    }));
  } catch {
    return [];
  }
}
