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
  id: string;
  name: string;
  city: string;
  plan: string;
  parents: number;
  teachers: number;
  mrr: string;
  status: string;
  since: string;
  paidThisMonth: boolean;
};

export async function listSchools(): Promise<SchoolRow[]> {
  if (!isLiveMode()) return MOCK_SCHOOLS.map((s, i) => ({ ...s, id: String(i), paidThisMonth: false }));
  try {
    const supabase = createClient();
    const period = new Date().toISOString().slice(0, 7);
    const [{ data: schools, error }, { data: staff }, { data: subs }, { data: schoolPays }] = await Promise.all([
      supabase
        .from("schools")
        .select("id, name, city, plan, status, joined_at")
        .order("joined_at", { ascending: false }),
      supabase.from("school_staff").select("school_id, role"),
      supabase.from("subscriptions").select("school_id, amount_cents, status"),
      supabase.from("school_payments").select("school_id").eq("period", period),
    ]);
    if (error || !schools) return [];
    const paidSet = new Set((schoolPays ?? []).map((p: any) => p.school_id));

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
      id: s.id,
      name: s.name,
      city: s.city,
      plan: s.plan === "pro" ? "Pro" : "Standard",
      parents: parents.get(s.id) ?? 0,
      teachers: teachers.get(s.id) ?? 0,
      mrr: mrr.get(s.id) ? fmtMoneyKpi(mrr.get(s.id)!) : "—",
      status: s.status,
      since: new Date(s.joined_at).toLocaleDateString("fr-FR", { month: "short", year: "numeric" }),
      paidThisMonth: paidSet.has(s.id),
    }));
  } catch {
    return [];
  }
}

// ── Console admin : tableau de bord « Écoles partenaires » ─────────────
export type AdminSchoolRow = {
  id: string;
  name: string;
  city: string;
  students: number;
  parents: number;     // parents connectés (distincts)
  messages: number;    // messages reçus par les familles ce mois
  documents: number;   // documents partagés (annonces + fiches)
  status: string;
};
export type RecentDoc = { name: string; url: string | null; schoolName: string; dateFr: string; kind: "fiche" | "annonce" };
export type SchoolsAdminOverview = {
  kpis: {
    activeSchools: number;
    totalSchools: number;
    totalStudents: number;
    connectedParents: number;
    parentsActivePct: number;
    messagesThisMonth: number;
    documentsShared: number;
    bugs: number;
  };
  schools: AdminSchoolRow[];
  distribution: { id: string; name: string; students: number }[];
  dailyActivity: number[];
  recentDocuments: RecentDoc[];
};

export async function getSchoolsAdminOverview(): Promise<SchoolsAdminOverview> {
  const empty: SchoolsAdminOverview = {
    kpis: { activeSchools: 0, totalSchools: 0, totalStudents: 0, connectedParents: 0, parentsActivePct: 0, messagesThisMonth: 0, documentsShared: 0, bugs: 0 },
    schools: [],
    distribution: [],
    dailyActivity: [],
    recentDocuments: [],
  };
  if (!isLiveMode()) return empty;
  try {
    const supabase = createClient();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    const [{ data: schools }, { data: students }, { data: links }, { data: docs }, { data: anns }, { data: notifs }, { count: bugs }] =
      await Promise.all([
        supabase.from("schools").select("id, name, city, status").order("name"),
        supabase.from("students").select("id, school_id").eq("status", "active"),
        supabase.from("parent_links").select("parent_id, access_status, students(school_id)"),
        (supabase as any).from("school_documents").select("school_id, name, url, created_at"),
        (supabase as any).from("announcements").select("school_id, attachment_url, attachment_name, title, created_at"),
        supabase.from("notifications").select("user_id, kind, created_at").gte("created_at", monthStart.toISOString()),
        supabase.from("support_tickets").select("*", { count: "exact", head: true }),
      ]);

    const schoolList = schools ?? [];
    const schoolName = new Map<string, string>(schoolList.map((s: any) => [s.id, s.name]));

    // Élèves par école.
    const studentsBySchool = new Map<string, number>();
    for (const s of students ?? []) {
      if (s.school_id) studentsBySchool.set(s.school_id, (studentsBySchool.get(s.school_id) ?? 0) + 1);
    }

    // Parents connectés (distincts) par école + mapping parent → écoles.
    const parentsBySchool = new Map<string, Set<string>>();
    const activeParents = new Set<string>();
    const allParents = new Set<string>();
    const parentSchools = new Map<string, Set<string>>();
    for (const l of links ?? []) {
      const sid = (l as any).students?.school_id;
      const pid = (l as any).parent_id;
      if (!sid || !pid) continue;
      allParents.add(pid);
      if ((l as any).access_status !== "blocked") activeParents.add(pid);
      if (!parentsBySchool.has(sid)) parentsBySchool.set(sid, new Set());
      parentsBySchool.get(sid)!.add(pid);
      if (!parentSchools.has(pid)) parentSchools.set(pid, new Set());
      parentSchools.get(pid)!.add(sid);
    }

    // Documents partagés par école (annonces avec pièce jointe + fiches école).
    const docsBySchool = new Map<string, number>();
    for (const d of docs ?? []) {
      const sid = (d as any).school_id;
      if (sid) docsBySchool.set(sid, (docsBySchool.get(sid) ?? 0) + 1);
    }
    for (const a of anns ?? []) {
      if ((a as any).attachment_url && (a as any).school_id) {
        const sid = (a as any).school_id;
        docsBySchool.set(sid, (docsBySchool.get(sid) ?? 0) + 1);
      }
    }

    // Messages reçus ce mois par école (via l'école du parent destinataire) + activité quotidienne.
    const messagesBySchool = new Map<string, number>();
    const dailyActivity = new Array(daysInMonth).fill(0);
    let messagesThisMonth = 0;
    for (const n of notifs ?? []) {
      const created = new Date((n as any).created_at);
      const day = created.getDate() - 1;
      if (day >= 0 && day < daysInMonth) dailyActivity[day] += 1;
      if ((n as any).kind === "message") {
        messagesThisMonth += 1;
        const schoolsOfParent = parentSchools.get((n as any).user_id);
        if (schoolsOfParent) for (const sid of schoolsOfParent) messagesBySchool.set(sid, (messagesBySchool.get(sid) ?? 0) + 1);
      }
    }

    const rows: AdminSchoolRow[] = schoolList.map((s) => ({
      id: s.id,
      name: s.name,
      city: s.city,
      students: studentsBySchool.get(s.id) ?? 0,
      parents: parentsBySchool.get(s.id)?.size ?? 0,
      messages: messagesBySchool.get(s.id) ?? 0,
      documents: docsBySchool.get(s.id) ?? 0,
      status: s.status,
    }));

    const totalStudents = [...studentsBySchool.values()].reduce((a, b) => a + b, 0);
    const documentsShared = [...docsBySchool.values()].reduce((a, b) => a + b, 0);

    // Derniers documents partagés (fiches école + pièces jointes d'annonces).
    const fmtDocDate = (d: string) => {
      const dt = new Date(d);
      return isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
    };
    const recentDocuments: RecentDoc[] = [
      ...(docs ?? []).map((d: any) => ({
        name: d.name ?? "Document",
        url: d.url ?? null,
        schoolName: schoolName.get(d.school_id) ?? "—",
        date: d.created_at as string,
        dateFr: fmtDocDate(d.created_at),
        kind: "fiche" as const,
      })),
      ...(anns ?? [])
        .filter((a: any) => a.attachment_url)
        .map((a: any) => ({
          name: a.attachment_name ?? a.title ?? "Pièce jointe",
          url: a.attachment_url as string,
          schoolName: schoolName.get(a.school_id) ?? "—",
          date: a.created_at as string,
          dateFr: fmtDocDate(a.created_at),
          kind: "annonce" as const,
        })),
    ]
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
      .slice(0, 6)
      .map(({ date: _date, ...rest }) => rest);

    return {
      kpis: {
        activeSchools: schoolList.filter((s) => s.status === "active").length,
        totalSchools: schoolList.length,
        totalStudents,
        connectedParents: allParents.size,
        parentsActivePct: allParents.size > 0 ? Math.round((activeParents.size / allParents.size) * 100) : 0,
        messagesThisMonth,
        documentsShared,
        bugs: bugs ?? 0,
      },
      schools: rows,
      distribution: rows
        .filter((r) => r.students > 0)
        .sort((a, b) => b.students - a.students)
        .map((r) => ({ id: r.id, name: r.name, students: r.students })),
      dailyActivity,
      recentDocuments,
    };
  } catch {
    return empty;
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

// État réel par défaut quand une requête échoue en prod : du vide, jamais du faux.
const EMPTY_OVERVIEW: Overview = {
  mrr12m: new Array(12).fill(0),
  topSchools: [],
  planDistribution: [
    { plan: "essentiel", count: 0 },
    { plan: "famille", count: 0 },
    { plan: "premium", count: 0 },
  ],
  kpis: { mrr: "$0", parents: "0", churn: "0.0%", schools: "0" },
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
    return EMPTY_OVERVIEW;
  }
}

// ── Flux de données : communications école → familles (mois en cours) ──
export type CommsFlow = { total: number; messages: number; bulletins: number; notes: number };

// Compteur global, toutes écoles confondues, des communications envoyées aux
// familles ce mois-ci : messages, bulletins/annonces (kind 'school') et notes.
export async function getCommsFlowThisMonth(): Promise<CommsFlow> {
  const empty: CommsFlow = { total: 0, messages: 0, bulletins: 0, notes: 0 };
  if (!isLiveMode()) return empty;
  try {
    const supabase = createClient();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const countKind = async (kind: string) => {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("kind", kind as any)
        .gte("created_at", monthStart);
      return count ?? 0;
    };
    const [messages, bulletins, notes] = await Promise.all([
      countKind("message"),
      countKind("school"),
      countKind("grade"),
    ]);
    return { total: messages + bulletins + notes, messages, bulletins, notes };
  } catch {
    return empty;
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
    return { new: [], pending: [], waiting: [], resolved: [] };
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

// ── Achats de livres (Mobile Money) ──────────────────────────────────
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
    return [];
  }
}
