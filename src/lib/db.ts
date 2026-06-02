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

// ── Formatting helpers ────────────────────────────────────────────────
function currencySymbol(cur: string): string {
  const c = (cur || "USD").toUpperCase();
  if (c === "USD") return "$";
  if (c === "EUR") return "€";
  if (c === "GBP") return "£";
  return c + " ";
}

function fmtMoney(cents: number, currency = "USD"): string {
  return `${currencySymbol(currency)}${(cents / 100).toFixed(2)}`;
}

function fmtMoneyKpi(cents: number, currency = "USD"): string {
  return `${currencySymbol(currency)}${Math.round(cents / 100).toLocaleString("fr-FR")}`;
}

function fmtDateTime(d: Date): string {
  return d.toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function planLabel(p: string): PaymentRow["plan"] {
  if (p === "famille") return "Famille";
  if (p === "premium") return "Premium";
  return "Essentiel";
}

// "active" recurring revenue counts active + trialing subscriptions.
function isActiveStatus(status: string): boolean {
  return status === "active" || status === "trialing";
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
    const [{ data: schools, error }, { data: staff }, { data: subs }] = await Promise.all([
      supabase
        .from("schools")
        .select("id, name, city, plan, status, joined_at")
        .order("joined_at", { ascending: false }),
      supabase.from("school_staff").select("school_id, role"),
      supabase.from("subscriptions").select("school_id, amount_cents, status"),
    ]);
    if (error || !schools) return MOCK_SCHOOLS;

    const teachers = new Map<string, number>();
    for (const s of staff ?? []) {
      if (s.role === "teacher" && s.school_id) {
        teachers.set(s.school_id, (teachers.get(s.school_id) ?? 0) + 1);
      }
    }

    const parents = new Map<string, number>();
    const mrr = new Map<string, number>();
    for (const s of subs ?? []) {
      if (!s.school_id || !isActiveStatus(s.status)) continue;
      parents.set(s.school_id, (parents.get(s.school_id) ?? 0) + 1);
      mrr.set(s.school_id, (mrr.get(s.school_id) ?? 0) + (s.amount_cents ?? 0));
    }

    return schools.map((s) => ({
      name: s.name,
      city: s.city,
      plan: s.plan === "pro" ? "Pro" : "Standard",
      parents: parents.get(s.id) ?? 0,
      teachers: teachers.get(s.id) ?? 0,
      mrr: mrr.get(s.id) ? fmtMoneyKpi(mrr.get(s.id)!) : "—",
      status: s.status,
      since: new Date(s.joined_at).toLocaleDateString("fr-FR", { month: "short", year: "numeric" }),
    }));
  } catch {
    return MOCK_SCHOOLS;
  }
}

// ── Overview ──────────────────────────────────────────────────────────
export type PlanSlice = { plan: "essentiel" | "famille" | "premium"; count: number };

export type Overview = {
  mrr12m: number[];
  topSchools: typeof MOCK_TOP_SCHOOLS;
  planDistribution: PlanSlice[];
  kpis: {
    mrr: string;
    parents: string;
    churn: string;
    schools: string;
  };
};

const MOCK_OVERVIEW: Overview = {
  mrr12m: MOCK_MRR_12M,
  topSchools: MOCK_TOP_SCHOOLS,
  planDistribution: [
    { plan: "essentiel", count: 2820 },
    { plan: "famille", count: 1120 },
    { plan: "premium", count: 380 },
  ],
  kpis: { mrr: "$39 400", parents: "4 320", churn: "2.4%", schools: "18" },
};

export async function getOverview(): Promise<Overview> {
  if (!isLiveMode()) return MOCK_OVERVIEW;
  try {
    const supabase = createClient();
    const [{ data: subs }, { count: parentsCount }, { count: schoolsCount }] = await Promise.all([
      supabase
        .from("subscriptions")
        .select("amount_cents, status, created_at, canceled_at, school_id, plan, schools(name, city)"),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "parent"),
      supabase.from("schools").select("*", { count: "exact", head: true }),
    ]);

    const rows = (subs ?? []) as any[];
    const active = rows.filter((s) => isActiveStatus(s.status));
    const mrrCents = active.reduce((sum, s) => sum + (s.amount_cents ?? 0), 0);

    // Churn approximé : abonnements résiliés / (actifs + résiliés).
    const canceled = rows.filter((s) => s.canceled_at).length;
    const churnPct = active.length + canceled > 0 ? (canceled / (active.length + canceled)) * 100 : 0;

    // Tendance MRR sur 12 mois : MRR actif estimé à la fin de chaque mois.
    const now = new Date();
    const mrr12m: number[] = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const cents = rows
        .filter(
          (s) =>
            new Date(s.created_at) <= monthEnd &&
            (!s.canceled_at || new Date(s.canceled_at) >= monthStart)
        )
        .reduce((sum, s) => sum + (s.amount_cents ?? 0), 0);
      mrr12m.push(cents / 100);
    }

    // Top écoles par MRR actif.
    const bySchool = new Map<string, { name: string; city: string; parents: number; mrrCents: number }>();
    for (const s of active) {
      if (!s.school_id) continue;
      const cur =
        bySchool.get(s.school_id) ??
        { name: s.schools?.name ?? "—", city: s.schools?.city ?? "", parents: 0, mrrCents: 0 };
      cur.parents += 1;
      cur.mrrCents += s.amount_cents ?? 0;
      bySchool.set(s.school_id, cur);
    }
    const topSchools = [...bySchool.values()]
      .sort((a, b) => b.mrrCents - a.mrrCents)
      .slice(0, 5)
      .map((x) => ({ name: x.name, city: x.city, parents: x.parents, mrr: fmtMoneyKpi(x.mrrCents), growth: "—" }));

    // Répartition réelle des plans (abonnements actifs uniquement).
    const planCounts: Record<string, number> = { essentiel: 0, famille: 0, premium: 0 };
    for (const s of active) {
      if (s.plan && s.plan in planCounts) planCounts[s.plan] += 1;
    }
    const planDistribution: PlanSlice[] = (["essentiel", "famille", "premium"] as const).map(
      (plan) => ({ plan, count: planCounts[plan] })
    );

    return {
      // Données RÉELLES — pas de repli sur la démo : une base vide affiche des zéros.
      mrr12m,
      topSchools,
      planDistribution,
      kpis: {
        mrr: fmtMoneyKpi(mrrCents),
        parents: (parentsCount ?? 0).toLocaleString("fr-FR"),
        churn: churnPct.toFixed(1) + "%",
        schools: String(schoolsCount ?? 0),
      },
    };
  } catch {
    return MOCK_OVERVIEW;
  }
}

// ── Billing ───────────────────────────────────────────────────────────
export async function listRecentPayments(): Promise<PaymentRow[]> {
  if (!isLiveMode()) return MOCK_PAYMENTS;
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("payments")
      .select("amount_cents, currency, status, paid_at, created_at, profiles(full_name), subscriptions(plan)")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error || !data) return MOCK_PAYMENTS;
    return data.map((p: any) => ({
      parent: p.profiles?.full_name ?? "—",
      plan: planLabel(p.subscriptions?.plan ?? "essentiel"),
      amount: fmtMoney(p.amount_cents ?? 0, p.currency),
      status: (["paid", "failed", "refunded"].includes(p.status) ? p.status : "paid") as PaymentRow["status"],
      date: fmtDateTime(new Date(p.paid_at ?? p.created_at)),
    }));
  } catch {
    return MOCK_PAYMENTS;
  }
}

// ── Support ───────────────────────────────────────────────────────────
export async function listTicketsByStatus(): Promise<Record<string, Ticket[]>> {
  if (!isLiveMode()) return MOCK_TICKETS;
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("support_tickets")
      .select(
        "reference, title, tag, priority, status, profiles!support_tickets_reporter_id_fkey(full_name), schools(name)"
      )
      .order("created_at", { ascending: false });
    if (error || !data) return MOCK_TICKETS;

    const grouped: Record<string, Ticket[]> = { new: [], pending: [], waiting: [], resolved: [] };
    for (const t of data as any[]) {
      const list = grouped[t.status];
      if (!list) continue;
      list.push({
        id: t.reference,
        title: { fr: t.title, en: t.title },
        who: t.profiles?.full_name ?? t.schools?.name ?? "—",
        tag: t.tag,
        pri: t.priority,
      });
    }
    return grouped;
  } catch {
    return MOCK_TICKETS;
  }
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
