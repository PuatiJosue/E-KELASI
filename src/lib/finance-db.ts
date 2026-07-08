// Couche données — frais scolaires / minerval par élève (Lot B).
// Lecture via le client service (la table n'est pas dans les types générés ;
// le scope école est garanti par getMySchool + filtre school_id).

import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getMySchool, listSchoolStudents } from "@/lib/school-db";
import { classLabel } from "@/lib/classes";
import { isLiveMode } from "@/lib/db";

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export type StudentPayment = {
  id: string;
  amount: number;
  currency: string;
  label: string | null;
  comment: string | null;
  receiptUrl: string | null;
  paidAt: string;
  recordedBy: string | null;
};

export type FeeSummaryRow = {
  studentId: string;
  fullName: string;
  className: string;
  sex: string | null;
  totals: { currency: string; total: number }[];
  count: number;
  lastPaidAt: string | null;
};

// Historique des paiements d'un élève (de SON école).
export async function listStudentPayments(studentId: string): Promise<StudentPayment[]> {
  if (!isLiveMode()) return [];
  try {
    const school = await getMySchool();
    if (!school) return [];
    const svc = service();
    const { data } = await svc
      .from("student_fee_payments")
      .select("id, amount, currency, label, comment, receipt_url, paid_at, profiles:recorded_by(full_name)")
      .eq("school_id", school.id)
      .eq("student_id", studentId)
      .order("paid_at", { ascending: false })
      .order("created_at", { ascending: false });
    return (data ?? []).map((p: any) => ({
      id: p.id,
      amount: Number(p.amount),
      currency: p.currency,
      label: p.label,
      comment: p.comment,
      receiptUrl: p.receipt_url,
      paidAt: p.paid_at,
      recordedBy: p.profiles?.full_name ?? null,
    }));
  } catch {
    return [];
  }
}

// Données d'un reçu de paiement (page imprimable). Scope école garanti.
export async function getPaymentForReceipt(paymentId: string) {
  if (!isLiveMode()) return null;
  try {
    const school = await getMySchool();
    if (!school) return null;
    const svc = service();
    const { data } = await svc
      .from("student_fee_payments")
      .select("id, amount, currency, label, comment, paid_at, created_at, students(full_name, class_name), profiles:recorded_by(full_name)")
      .eq("school_id", school.id)
      .eq("id", paymentId)
      .maybeSingle();
    if (!data) return null;
    const p: any = data;
    return {
      id: p.id,
      amount: Number(p.amount),
      currency: p.currency as string,
      label: p.label as string | null,
      comment: p.comment as string | null,
      paidAt: p.paid_at as string,
      recordedBy: p.profiles?.full_name ?? null,
      studentName: p.students?.full_name ?? "—",
      className: p.students?.class_name ?? null,
      school: {
        name: school.name,
        city: school.city ?? "",
        commune: (school as any).commune ?? "",
        logoUrl: school.logoUrl ?? null,
        signatureUrl: school.signatureUrl ?? null,
        directorName: school.directorName ?? null,
      },
    };
  } catch {
    return null;
  }
}

// Récapitulatif par élève (page Finances) : totaux par devise + dernier paiement.
export async function getSchoolFeeSummary(): Promise<FeeSummaryRow[]> {
  if (!isLiveMode()) return [];
  try {
    const school = await getMySchool();
    if (!school) return [];
    const svc = service();
    const [students, { data: payments }] = await Promise.all([
      listSchoolStudents(),
      svc
        .from("student_fee_payments")
        .select("student_id, amount, currency, paid_at")
        .eq("school_id", school.id),
    ]);

    const byStudent = new Map<string, { totals: Map<string, number>; count: number; last: string | null }>();
    for (const p of payments ?? []) {
      const sid = (p as any).student_id;
      if (!byStudent.has(sid)) byStudent.set(sid, { totals: new Map(), count: 0, last: null });
      const e = byStudent.get(sid)!;
      const cur = (p as any).currency ?? "USD";
      e.totals.set(cur, (e.totals.get(cur) ?? 0) + Number((p as any).amount));
      e.count++;
      const d = (p as any).paid_at as string;
      if (!e.last || d > e.last) e.last = d;
    }

    return students.map((s) => {
      const e = byStudent.get(s.id);
      return {
        studentId: s.id,
        fullName: s.fullName,
        className: s.className,
        sex: s.sex ?? null,
        totals: e ? [...e.totals.entries()].map(([currency, total]) => ({ currency, total })) : [],
        count: e?.count ?? 0,
        lastPaidAt: e?.last ?? null,
      };
    });
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────
// Module Finance complet (rubriques, dû/payé/reste, situation des élèves)
// ─────────────────────────────────────────────────────────────────────

export type PaymentStatus = "paye" | "partiel" | "non_paye";
export type FinanceStatus = "en_ordre" | "en_retard" | "insolvable" | "en_traitement";

export type FeeCategory = {
  id: string;
  name: string;
  amount: number;
  currency: string;
  position: number;
};

export type FinanceStudentRow = {
  id: string;
  matricule: string;
  fullName: string;
  avatarUrl: string | null;
  sex: string | null;
  className: string;
  parentName: string;
  parentPhone: string | null;
  totalDue: number;
  paid: number;
  remaining: number;
  currency: string;
  paymentStatus: PaymentStatus;
  financeStatus: FinanceStatus;
};

export type FinanceOverview = {
  currency: string;
  kpis: { totalDue: number; totalPaid: number; pending: number; late: number };
  students: FinanceStudentRow[];
  distribution: { paid: number; partial: number; late: number; unpaid: number };
  situation: { enOrdre: number; enRetard: number; insolvable: number; enTraitement: number };
  total: number;
};

export type StudentFeeLine = {
  id: string;
  categoryId: string | null;
  label: string;
  amountDue: number;
  paid: number;
  remaining: number;
  currency: string;
};

export type StudentFinanceDetail = {
  student: FinanceStudentRow;
  fees: StudentFeeLine[];
  payments: StudentPayment[];
};

const paymentStatusOf = (due: number, paid: number): PaymentStatus =>
  paid <= 0 ? "non_paye" : due - paid <= 0.001 && due > 0 ? "paye" : "partiel";

// Catégorie unique pour le camembert « répartition par statut de paiement ».
function donutBucket(r: { financeStatus: FinanceStatus; totalDue: number; paid: number }): keyof FinanceOverview["distribution"] {
  if (r.financeStatus === "en_retard") return "late";
  if (r.totalDue > 0 && r.totalDue - r.paid <= 0.001) return "paid";
  if (r.paid > 0) return "partial";
  return "unpaid";
}

export async function listFeeCategories(): Promise<FeeCategory[]> {
  if (!isLiveMode()) return MOCK_CATEGORIES;
  try {
    const school = await getMySchool();
    if (!school) return [];
    const svc = service();
    const { data } = await svc
      .from("fee_categories")
      .select("id, name, amount, currency, position")
      .eq("school_id", school.id)
      .order("position")
      .order("created_at");
    return (data ?? []).map((c: any) => ({
      id: c.id,
      name: c.name,
      amount: Number(c.amount),
      currency: c.currency ?? "CDF",
      position: c.position ?? 0,
    }));
  } catch {
    return [];
  }
}

export async function getFinanceOverview(): Promise<FinanceOverview> {
  if (!isLiveMode()) return MOCK_OVERVIEW;
  try {
    const school = await getMySchool();
    if (!school) return emptyOverview();
    const svc = service();

    const [{ data: students }, { data: fees }, { data: payments }] = await Promise.all([
      svc.from("students")
        .select("id, full_name, matricule, class_name, option, sex, avatar_url, finance_status")
        .eq("school_id", school.id)
        .eq("status", "active")
        .order("class_name")
        .order("full_name"),
      svc.from("student_fees").select("student_id, amount_due, currency").eq("school_id", school.id),
      svc.from("student_fee_payments").select("student_id, amount, currency").eq("school_id", school.id),
    ]);

    const ids = (students ?? []).map((s: any) => s.id);
    const { data: links } = ids.length
      ? await svc.from("parent_links")
          .select("student_id, is_primary, profiles!parent_links_parent_id_fkey(full_name, phone)")
          .in("student_id", ids)
      : { data: [] as any[] };

    const parentByStudent = new Map<string, { name: string; phone: string | null }>();
    for (const l of (links ?? []) as any[]) {
      if (!parentByStudent.has(l.student_id) || l.is_primary) {
        parentByStudent.set(l.student_id, { name: l.profiles?.full_name ?? "—", phone: l.profiles?.phone ?? null });
      }
    }

    const dueByStudent = new Map<string, number>();
    let currency = "CDF";
    for (const f of (fees ?? []) as any[]) {
      dueByStudent.set(f.student_id, (dueByStudent.get(f.student_id) ?? 0) + Number(f.amount_due));
      if (f.currency) currency = f.currency;
    }
    const paidByStudent = new Map<string, number>();
    for (const p of (payments ?? []) as any[]) {
      paidByStudent.set(p.student_id, (paidByStudent.get(p.student_id) ?? 0) + Number(p.amount));
    }

    const rows: FinanceStudentRow[] = (students ?? []).map((s: any) => {
      const totalDue = dueByStudent.get(s.id) ?? 0;
      const paid = paidByStudent.get(s.id) ?? 0;
      const remaining = Math.max(0, totalDue - paid);
      const parent = parentByStudent.get(s.id);
      return {
        id: s.id,
        matricule: s.matricule ?? "—",
        fullName: s.full_name,
        avatarUrl: s.avatar_url ?? null,
        sex: s.sex ?? null,
        className: classLabel(s.class_name, s.option),
        parentName: parent?.name ?? "—",
        parentPhone: parent?.phone ?? null,
        totalDue,
        paid,
        remaining,
        currency,
        paymentStatus: paymentStatusOf(totalDue, paid),
        financeStatus: (s.finance_status ?? "en_ordre") as FinanceStatus,
      };
    });

    return buildOverview(rows, currency);
  } catch {
    return emptyOverview();
  }
}

export async function getStudentFinanceDetail(studentId: string): Promise<StudentFinanceDetail | null> {
  if (!isLiveMode()) return MOCK_DETAIL(studentId);
  try {
    const school = await getMySchool();
    if (!school) return null;
    const svc = service();

    const { data: s } = await svc.from("students")
      .select("id, full_name, matricule, class_name, option, sex, avatar_url, finance_status")
      .eq("id", studentId).eq("school_id", school.id).maybeSingle();
    if (!s) return null;

    const [{ data: feeRows }, payments, { data: links }] = await Promise.all([
      svc.from("student_fees").select("id, category_id, label, amount_due, currency").eq("school_id", school.id).eq("student_id", studentId).order("created_at"),
      listStudentPayments(studentId),
      svc.from("parent_links").select("is_primary, profiles!parent_links_parent_id_fkey(full_name, phone)").eq("student_id", studentId),
    ]);

    let totalPaid = 0;
    for (const p of payments) totalPaid += p.amount;

    const currency = ((feeRows ?? [])[0] as any)?.currency ?? "CDF";
    let totalDue = 0;
    const fees: StudentFeeLine[] = (feeRows ?? []).map((f: any) => {
      totalDue += Number(f.amount_due);
      return {
        id: f.id,
        categoryId: f.category_id ?? null,
        label: f.label ?? "Frais",
        amountDue: Number(f.amount_due),
        paid: 0,
        remaining: Number(f.amount_due),
        currency: f.currency ?? currency,
      };
    });

    // Répartit le total payé sur les rubriques (dans l'ordre) pour le détail.
    let leftover = totalPaid;
    for (const f of fees) {
      const applied = Math.min(f.amountDue, Math.max(0, leftover));
      f.paid = applied;
      f.remaining = Math.max(0, f.amountDue - applied);
      leftover -= applied;
    }

    const parent = ((links ?? []) as any[]).sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))[0];
    const remaining = Math.max(0, totalDue - totalPaid);
    const student: FinanceStudentRow = {
      id: (s as any).id,
      matricule: (s as any).matricule ?? "—",
      fullName: (s as any).full_name,
      avatarUrl: (s as any).avatar_url ?? null,
      sex: (s as any).sex ?? null,
      className: classLabel((s as any).class_name, (s as any).option),
      parentName: parent?.profiles?.full_name ?? "—",
      parentPhone: parent?.profiles?.phone ?? null,
      totalDue,
      paid: totalPaid,
      remaining,
      currency,
      paymentStatus: paymentStatusOf(totalDue, totalPaid),
      financeStatus: ((s as any).finance_status ?? "en_ordre") as FinanceStatus,
    };

    return { student, fees, payments };
  } catch {
    return null;
  }
}

function buildOverview(rows: FinanceStudentRow[], currency: string): FinanceOverview {
  const totalDue = rows.reduce((a, r) => a + r.totalDue, 0);
  const totalPaid = rows.reduce((a, r) => a + Math.min(r.paid, r.totalDue || r.paid), 0);
  const pending = Math.max(0, totalDue - totalPaid);
  const late = rows.filter((r) => r.financeStatus === "en_retard").reduce((a, r) => a + r.remaining, 0);

  const distribution = { paid: 0, partial: 0, late: 0, unpaid: 0 };
  const situation = { enOrdre: 0, enRetard: 0, insolvable: 0, enTraitement: 0 };
  for (const r of rows) {
    distribution[donutBucket(r)]++;
    if (r.financeStatus === "en_retard") situation.enRetard++;
    else if (r.financeStatus === "insolvable") situation.insolvable++;
    else if (r.financeStatus === "en_traitement") situation.enTraitement++;
    else if (r.totalDue > 0 && r.totalDue - r.paid <= 0.001) situation.enOrdre++;
  }
  return { currency, kpis: { totalDue, totalPaid, pending, late }, students: rows, distribution, situation, total: rows.length };
}

function emptyOverview(): FinanceOverview {
  return { currency: "CDF", kpis: { totalDue: 0, totalPaid: 0, pending: 0, late: 0 }, students: [], distribution: { paid: 0, partial: 0, late: 0, unpaid: 0 }, situation: { enOrdre: 0, enRetard: 0, insolvable: 0, enTraitement: 0 }, total: 0 };
}

// ── Données de démonstration (mode non connecté) ─────────────────────
const MOCK_CATEGORIES: FeeCategory[] = [
  { id: "c1", name: "Frais de scolarité", amount: 75000, currency: "CDF", position: 0 },
  { id: "c2", name: "Frais d'examen", amount: 25000, currency: "CDF", position: 1 },
  { id: "c3", name: "Frais de fournitures", amount: 20000, currency: "CDF", position: 2 },
  { id: "c4", name: "Activités parascolaires", amount: 10000, currency: "CDF", position: 3 },
  { id: "c5", name: "Assurance scolaire", amount: 10000, currency: "CDF", position: 4 },
];

const MOCK_NAMES: [string, string, string][] = [
  ["Diallo", "Moussa", "M"], ["Koné", "Aïssata", "F"], ["Traoré", "Ibrahim", "M"],
  ["Camara", "Fatou", "F"], ["Sow", "Amadou", "M"], ["Baldé", "Mariama", "F"],
  ["Diabaté", "Jean", "M"], ["Cissé", "Awa", "F"], ["Bah", "Ousmane", "M"], ["Fofana", "Kadiatou", "F"],
];
const MOCK_CLASSES = ["5ème A", "4ème B", "3ème A", "6ème A"];
const MOCK_STATUSES: FinanceStatus[] = ["en_ordre", "en_retard", "insolvable", "en_ordre", "en_retard", "en_ordre", "en_traitement", "en_ordre", "en_retard", "en_ordre"];

function mockRows(): FinanceStudentRow[] {
  return MOCK_NAMES.map(([last, first, sex], i) => {
    const totalDue = 250000 + (i % 4) * 50000;
    const paid = [150000, 0, 0, 150000, 0, 200000, 0, 320000, 0, 250000][i] ?? 0;
    const remaining = Math.max(0, totalDue - paid);
    return {
      id: `mock-${i}`,
      matricule: `ELV-00${125 + i}`,
      fullName: `${last} ${first}`,
      avatarUrl: null,
      sex,
      className: MOCK_CLASSES[i % MOCK_CLASSES.length],
      parentName: `M. ${last} Ibrahima`,
      parentPhone: "+243 812 34 56",
      totalDue,
      paid,
      remaining,
      currency: "CDF",
      paymentStatus: paymentStatusOf(totalDue, paid),
      financeStatus: MOCK_STATUSES[i] ?? "en_ordre",
    };
  });
}

const MOCK_OVERVIEW: FinanceOverview = buildOverview(mockRows(), "CDF");

function MOCK_DETAIL(studentId: string): StudentFinanceDetail {
  const row = mockRows().find((r) => r.id === studentId) ?? mockRows()[0];
  let leftover = row.paid;
  const fees: StudentFeeLine[] = MOCK_CATEGORIES.map((c) => {
    const applied = Math.min(c.amount, Math.max(0, leftover));
    leftover -= applied;
    return { id: c.id, categoryId: c.id, label: c.name, amountDue: c.amount, paid: applied, remaining: Math.max(0, c.amount - applied), currency: "CDF" };
  });
  return { student: row, fees, payments: [] };
}
