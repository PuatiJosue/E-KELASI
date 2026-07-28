// Fiche détaillée d'une école (console admin).

import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/env";
import { schoolPriceCents } from "@/lib/school-price";
import { fmtMoney } from "./format";

export type SchoolDossier = {
  id: string;
  name: string;
  city: string;
  commune: string | null;
  quartier: string | null;
  address: string | null;
  countryCode: string | null;
  plan: string;
  status: string;
  directorName: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  currentYear: string | null;
  joinedFr: string | null;
  counts: { students: number; pending: number; parents: number; teachers: number; classes: number; documents: number };
  classes: { label: string; students: number }[];
  staff: { name: string; email: string | null; role: string; joinedFr: string | null }[];
  documents: { name: string; url: string | null; dateFr: string }[];
  accessCodes: { code: string; redeemed: boolean; redeemedFr: string | null }[];
  billing: SchoolBilling;
};

export type SchoolPaymentRow = {
  period: string;        // 'YYYY-MM'
  periodFr: string;      // 'juillet 2026'
  amountCents: number;
  amountLabel: string;
  method: string;
  reference: string | null;
  note: string | null;
  paidAtFr: string | null;
};

export type SchoolBilling = {
  period: string;            // mois en cours 'YYYY-MM'
  periodFr: string;
  priceCents: number;        // tarif attendu, pour préremplir la saisie
  priceLabel: string;
  currentMonth: SchoolPaymentRow | null; // null = mois non réglé
  history: SchoolPaymentRow[];           // 12 derniers mois, le plus récent d'abord
};

export async function getSchoolDossier(id: string): Promise<SchoolDossier | null> {
  if (!id || !isLiveMode()) return null;
  try {
    const supabase = createClient();
    const fmtDate = (d: string | null) => {
      if (!d) return null;
      const dt = new Date(d);
      return isNaN(dt.getTime()) ? null : dt.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
    };

    const { data: school } = await (supabase as any)
      .from("schools")
      .select("id, name, city, commune, quartier, address, country_code, plan, status, director_name, email, phone, notes, current_year, joined_at")
      .eq("id", id)
      .maybeSingle();
    if (!school) return null;

    const [{ data: students }, { data: staff }, { data: docs }, { data: codes }, { data: payments }] = await Promise.all([
      supabase.from("students").select("id, class_name, status").eq("school_id", id),
      supabase.from("school_staff").select("user_id, role, created_at").eq("school_id", id),
      (supabase as any).from("school_documents").select("name, url, created_at").eq("school_id", id).order("created_at", { ascending: false }),
      (supabase as any).from("school_access_codes").select("code, redeemed_at, created_at").eq("school_id", id).order("created_at", { ascending: false }),
      (supabase as any)
        .from("school_payments")
        .select("period, amount_cents, currency, method, reference, note, paid_at")
        .eq("school_id", id)
        .order("period", { ascending: false })
        .limit(12),
    ]);

    const studentList = students ?? [];
    const activeStudents = studentList.filter((s: any) => s.status === "active");
    const pending = studentList.filter((s: any) => s.status === "pending").length;
    const studentIds = studentList.map((s: any) => s.id);

    // Parents connectés (distincts) reliés à un élève de cette école.
    let parents = 0;
    if (studentIds.length) {
      const { data: links } = await supabase.from("parent_links").select("parent_id").in("student_id", studentIds);
      parents = new Set((links ?? []).map((l: any) => l.parent_id).filter(Boolean)).size;
    }

    // Classes (par class_name distinct, sur les élèves actifs).
    const classMap = new Map<string, number>();
    for (const s of activeStudents) {
      const label = (s as any).class_name || "—";
      classMap.set(label, (classMap.get(label) ?? 0) + 1);
    }
    const classes = [...classMap.entries()].map(([label, n]) => ({ label, students: n })).sort((a, b) => a.label.localeCompare(b.label, "fr"));

    // Abonnement : état du mois en cours + historique des encaissements.
    const period = new Date().toISOString().slice(0, 7);
    const periodLabel = (p: string) => {
      const [y, m] = p.split("-").map(Number);
      if (!y || !m) return p;
      return new Date(y, m - 1, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    };
    const paymentRows: SchoolPaymentRow[] = (payments ?? []).map((p: any) => ({
      period: p.period,
      periodFr: periodLabel(p.period),
      amountCents: p.amount_cents ?? 0,
      amountLabel: fmtMoney(p.amount_cents ?? 0, p.currency ?? "USD"),
      method: p.method ?? "manual",
      reference: p.reference ?? null,
      note: p.note ?? null,
      paidAtFr: fmtDate(p.paid_at),
    }));
    const billing: SchoolBilling = {
      period,
      periodFr: periodLabel(period),
      priceCents: schoolPriceCents(),
      priceLabel: fmtMoney(schoolPriceCents()),
      currentMonth: paymentRows.find((p) => p.period === period) ?? null,
      history: paymentRows,
    };

    // Noms du personnel.
    const staffList = staff ?? [];
    const staffIds = staffList.map((s: any) => s.user_id).filter(Boolean);
    const profMap = new Map<string, { full_name: string | null; email: string | null }>();
    if (staffIds.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name, email").in("id", staffIds);
      for (const p of profs ?? []) profMap.set((p as any).id, { full_name: (p as any).full_name, email: (p as any).email });
    }

    return {
      id: school.id,
      name: school.name,
      city: school.city,
      commune: (school as any).commune ?? null,
      quartier: (school as any).quartier ?? null,
      address: (school as any).address ?? null,
      countryCode: (school as any).country_code ?? null,
      plan: school.plan,
      status: school.status,
      directorName: (school as any).director_name ?? null,
      email: (school as any).email ?? null,
      phone: (school as any).phone ?? null,
      notes: (school as any).notes ?? null,
      currentYear: (school as any).current_year ?? null,
      joinedFr: fmtDate((school as any).joined_at),
      counts: {
        students: activeStudents.length,
        pending,
        parents,
        teachers: staffList.length,
        classes: classMap.size,
        documents: (docs ?? []).length,
      },
      classes,
      staff: staffList.map((s: any) => {
        const p = profMap.get(s.user_id);
        return {
          name: p?.full_name ?? "—",
          email: p?.email ?? null,
          role: s.role,
          joinedFr: fmtDate(s.created_at),
        };
      }),
      documents: (docs ?? []).map((d: any) => ({ name: d.name ?? "Document", url: d.url ?? null, dateFr: fmtDate(d.created_at) ?? "—" })),
      accessCodes: (codes ?? []).map((c: any) => ({ code: c.code, redeemed: Boolean(c.redeemed_at), redeemedFr: fmtDate(c.redeemed_at) })),
      billing,
    };
  } catch {
    return null;
  }
}
