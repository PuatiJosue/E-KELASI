// Achats de livres réglés en Mobile Money.

import { createClient } from "@/lib/supabase/server";
import { fmtMMDate } from "./format";
import { isLiveMode } from "@/lib/env";

export type BookPurchaseRow = {
  id: string;
  parentName: string;
  bookTitle: string;
  senderPhone: string;
  provider: string;
  amountCents: number;
  currency: string;
  reference: string;
  status: "pending" | "paid" | "rejected";
  createdAt: string;
};

export async function listPendingBookPurchases(): Promise<BookPurchaseRow[]> {
  if (!isLiveMode()) return [];
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("library_purchases")
      .select("id, provider, amount_cents, currency, sender_phone, reference, status, created_at, profiles!library_purchases_parent_id_fkey(full_name), library_books(title)")
      .eq("method", "mobile_money")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return data.map((r: any) => ({
      id: r.id,
      parentName: r.profiles?.full_name ?? "?",
      bookTitle: r.library_books?.title ?? "?",
      senderPhone: r.sender_phone ?? "",
      provider: r.provider ?? "",
      amountCents: r.amount_cents,
      currency: r.currency,
      reference: r.reference ?? "",
      status: r.status,
      createdAt: fmtMMDate(new Date(r.created_at)),
    }));
  } catch {
    return [];
  }
}
