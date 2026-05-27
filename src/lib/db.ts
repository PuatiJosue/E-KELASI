// Server-side data layer. Falls back to mocks when Supabase isn't configured —
// keeps the prototype browsable without a database, while real env vars
// transparently switch every screen to live queries.

import { createClient } from "@/lib/supabase/server";
import {
  MOCK_MRR_12M,
  MOCK_TOP_SCHOOLS,
  MOCK_SCHOOLS,
  MOCK_PAYMENTS,
  MOCK_TICKETS,
  MOCK_LOGS,
  type LogEvent,
  type PaymentRow,
  type Ticket,
} from "@/lib/mock";

export function isLiveMode() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

// ── Schools ───────────────────────────────────────────────────────────
export type SchoolRow = {
  name: string;
  city: string;
  plan: string;
  parents: number;
  teachers: number;
  mrr: string;
  status: string;
  since: string;
};

export async function listSchools(): Promise<SchoolRow[]> {
  if (!isLiveMode()) return MOCK_SCHOOLS;
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("schools")
      .select("name, city, plan, status, joined_at")
      .order("joined_at", { ascending: false });
    if (error || !data) return MOCK_SCHOOLS;
    return data.map((s) => ({
      name: s.name,
      city: s.city,
      plan: s.plan === "pro" ? "Pro" : "Standard",
      parents: 0,
      teachers: 0,
      mrr: "—",
      status: s.status,
      since: new Date(s.joined_at).toLocaleDateString("fr-FR", { month: "short", year: "numeric" }),
    }));
  } catch {
    return MOCK_SCHOOLS;
  }
}

// ── Overview ──────────────────────────────────────────────────────────
export type Overview = {
  mrr12m: number[];
  topSchools: typeof MOCK_TOP_SCHOOLS;
  kpis: {
    mrr: string;
    parents: string;
    churn: string;
    schools: string;
  };
};

export async function getOverview(): Promise<Overview> {
  // Live MRR computation will live in a Postgres view once payments table is populated.
  // For now, mocks are the source of truth.
  return {
    mrr12m: MOCK_MRR_12M,
    topSchools: MOCK_TOP_SCHOOLS,
    kpis: { mrr: "€39 400", parents: "4 320", churn: "2.4%", schools: "18" },
  };
}

// ── Billing ───────────────────────────────────────────────────────────
export async function listRecentPayments(): Promise<PaymentRow[]> {
  // TODO: pull from `payments` table once Stripe webhook is wired.
  return MOCK_PAYMENTS;
}

// ── Support ───────────────────────────────────────────────────────────
export async function listTicketsByStatus(): Promise<Record<string, Ticket[]>> {
  // TODO: query `support_tickets` grouped by status.
  return MOCK_TICKETS;
}

// ── Mobile Money payments ────────────────────────────────────────────
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

function fmtMMDate(d: Date): string {
  const now = new Date();
  const diffMin = Math.round((now.getTime() - d.getTime()) / 60000);
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `Il y a ${diffH} h`;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

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

// ── Security ──────────────────────────────────────────────────────────
export async function listAuditLogs(limit = 50): Promise<LogEvent[]> {
  if (!isLiveMode()) return MOCK_LOGS;
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("audit_logs")
      .select("severity, actor, source, message, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error || !data) return MOCK_LOGS;
    return data.map((r) => ({
      sev: r.severity,
      actor: r.actor,
      src: r.source,
      msg: { fr: r.message, en: r.message },
      ts: new Date(r.created_at).toISOString().slice(11, 19),
    }));
  } catch {
    return MOCK_LOGS;
  }
}
