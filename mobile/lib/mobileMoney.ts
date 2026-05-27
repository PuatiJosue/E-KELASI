// Mobile Money providers + instructions de paiement.
// MVP : mode manuel — le parent transfère vers le numéro affiché,
// soumet sa preuve, un admin valide. Plus tard : intégration directe
// (Wave, FedaPay, Flutterwave, MTN Open API, Orange Money API).

import { supabase, isLiveMode } from "./supabase";
import type { PlanId } from "./plans";

export type MMProvider = "orange" | "airtel" | "mtn" | "mpesa" | "wave";

export type MMProviderInfo = {
  id: MMProvider;
  name: string;
  countries: string[];
  color: string;
  emoji: string;
};

export const MM_PROVIDERS: MMProviderInfo[] = [
  { id: "orange", name: "Orange Money", countries: ["SN", "CI", "ML", "CM", "MG"], color: "#FF6600", emoji: "🟠" },
  { id: "mtn",    name: "MTN MoMo",     countries: ["CI", "CM", "BJ", "CG", "GH"], color: "#FFCC00", emoji: "💛" },
  { id: "airtel", name: "Airtel Money", countries: ["CD", "GA", "TZ", "KE", "UG"], color: "#E60000", emoji: "🔴" },
  { id: "wave",   name: "Wave",         countries: ["SN", "CI", "ML"],             color: "#1DC3F8", emoji: "💙" },
  { id: "mpesa",  name: "M-Pesa",       countries: ["KE", "TZ", "MZ", "CD"],       color: "#00A651", emoji: "🟢" },
];

// Le numéro qui reçoit les paiements E-KELASI (à changer en config plus tard).
export const RECIPIENT_NUMBER = "+243 828 977 717";
export const RECIPIENT_NAME = "E-KELASI";

export async function createMobileMoneyPayment(args: {
  plan: PlanId;
  amountCents: number;
  currency: string;
  provider: MMProvider;
  senderPhone: string;
  reference: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!isLiveMode || !supabase) {
    return { ok: true, id: `demo-${Date.now()}` };
  }
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Non connecté" };

    const { data, error } = await supabase
      .from("mobile_money_payments")
      .insert({
        parent_id: user.id,
        plan: args.plan,
        amount_cents: args.amountCents,
        currency: args.currency,
        provider: args.provider,
        sender_phone: args.senderPhone,
        reference: args.reference,
      })
      .select("id")
      .single();
    if (error || !data) return { ok: false, error: error?.message ?? "Erreur inconnue" };
    return { ok: true, id: data.id };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Erreur réseau" };
  }
}
