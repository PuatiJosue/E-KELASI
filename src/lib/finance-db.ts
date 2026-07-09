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
// Statut financier AUTOMATIQUE (jamais saisi à la main) :
//   en_ordre     → plus rien à payer
//   non_paye     → reste à payer (sans échéance dépassée)
//   insolvable   → au moins une échéance (tranche) dépassée non payée
export type FinanceStatus = "en_ordre" | "non_paye" | "insolvable";

// Calcule le statut à partir des montants et des échéances en retard.
function autoFinanceStatus(totalDue: number, paid: number, overdue: boolean): FinanceStatus {
  if (overdue) return "insolvable";
  if (totalDue <= 0 || totalDue - paid <= 0.001) return "en_ordre";
  return "non_paye";
}

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
  distribution: { paid: number; partial: number; unpaid: number };
  situation: { enOrdre: number; nonPaye: number; insolvable: number };
  total: number;
};

export type StudentFeeLine = {
  id: string;
  categoryId: string | null;
  label: string;
  amountDue: number;
  advances: number;          // avances & acomptes affectés à cette rubrique
  echPaidCount: number;      // tranches payées
  echTotalCount: number;     // tranches totales
  echPaidAmount: number;     // montant des tranches payées
  echTotalAmount: number;    // montant total des tranches
  paid: number;              // advances + echPaidAmount
  remaining: number;
  currency: string;
};

export type StudentAdvance = {
  id: string;
  studentId: string;
  categoryId: string | null;
  categoryLabel: string | null;
  amount: number;
  currency: string;
  note: string | null;
  createdAt: string;
  studentName?: string;
  className?: string;
};

export type StudentInstallment = {
  id: string;
  studentId: string;
  categoryId: string | null;
  categoryLabel: string | null;
  label: string;
  period: string | null;
  amount: number;
  currency: string;
  dueDate: string | null;
  paidAt: string | null;
  studentName?: string;
  className?: string;
};

export type InstallmentTemplate = {
  id: string;
  name: string;
  period: string | null;
  dateFrom: string | null;
  dateTo: string | null;
  amount: number;
  currency: string;
  position: number;
};

export type StudentFinanceDetail = {
  student: FinanceStudentRow;
  fees: StudentFeeLine[];
  payments: StudentPayment[];
  advances: StudentAdvance[];
  installments: StudentInstallment[];
};

const paymentStatusOf = (due: number, paid: number): PaymentStatus =>
  paid <= 0 ? "non_paye" : due - paid <= 0.001 && due > 0 ? "paye" : "partiel";

// Catégorie unique pour le camembert « répartition par statut de paiement »
// (basé uniquement sur les montants dû / payé).
function donutBucket(r: { totalDue: number; paid: number }): keyof FinanceOverview["distribution"] {
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

export async function listInstallmentTemplates(): Promise<InstallmentTemplate[]> {
  if (!isLiveMode()) return MOCK_TEMPLATES;
  try {
    const school = await getMySchool();
    if (!school) return [];
    const svc = service();
    const { data } = await svc
      .from("installment_templates")
      .select("id, name, period, date_from, date_to, amount, currency, position")
      .eq("school_id", school.id)
      .order("position")
      .order("created_at");
    return (data ?? []).map((t: any) => ({
      id: t.id, name: t.name, period: t.period ?? null,
      dateFrom: t.date_from ?? null, dateTo: t.date_to ?? null,
      amount: Number(t.amount), currency: t.currency ?? "CDF", position: t.position ?? 0,
    }));
  } catch { return []; }
}

export async function getFinanceOverview(): Promise<FinanceOverview> {
  if (!isLiveMode()) return MOCK_OVERVIEW;
  try {
    const school = await getMySchool();
    if (!school) return emptyOverview();
    const svc = service();

    const [{ data: students }, { data: fees }, { data: payments }, { data: advances }, { data: installments }] = await Promise.all([
      svc.from("students")
        .select("id, full_name, matricule, class_name, option, sex, avatar_url, finance_status")
        .eq("school_id", school.id)
        .eq("status", "active")
        .order("class_name")
        .order("full_name"),
      svc.from("student_fees").select("student_id, amount_due, currency").eq("school_id", school.id),
      svc.from("student_fee_payments").select("student_id, amount, currency").eq("school_id", school.id),
      svc.from("student_advances").select("student_id, amount").eq("school_id", school.id),
      svc.from("student_installments").select("student_id, amount, paid_at, due_date").eq("school_id", school.id),
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
    for (const a of (advances ?? []) as any[]) {
      paidByStudent.set(a.student_id, (paidByStudent.get(a.student_id) ?? 0) + Number(a.amount));
    }
    const today = new Date().toISOString().slice(0, 10);
    const overdueByStudent = new Set<string>();
    for (const it of (installments ?? []) as any[]) {
      if (it.paid_at) paidByStudent.set(it.student_id, (paidByStudent.get(it.student_id) ?? 0) + Number(it.amount));
      else if (it.due_date && it.due_date < today) overdueByStudent.add(it.student_id);
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
        financeStatus: autoFinanceStatus(totalDue, paid, overdueByStudent.has(s.id)),
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

    const [{ data: feeRows }, payments, { data: links }, { data: advRows }, { data: instRows }, cats] = await Promise.all([
      svc.from("student_fees").select("id, category_id, label, amount_due, currency").eq("school_id", school.id).eq("student_id", studentId).order("created_at"),
      listStudentPayments(studentId),
      svc.from("parent_links").select("is_primary, profiles!parent_links_parent_id_fkey(full_name, phone)").eq("student_id", studentId),
      svc.from("student_advances").select("id, category_id, amount, currency, note, created_at").eq("school_id", school.id).eq("student_id", studentId).order("created_at", { ascending: false }),
      svc.from("student_installments").select("id, category_id, label, period, amount, currency, due_date, paid_at").eq("school_id", school.id).eq("student_id", studentId).order("due_date"),
      listFeeCategories(),
    ]);

    const catLabel = new Map<string, string>(cats.map((c) => [c.id, c.name]));
    const currency = ((feeRows ?? [])[0] as any)?.currency ?? "CDF";

    const advances: StudentAdvance[] = (advRows ?? []).map((a: any) => ({
      id: a.id, studentId, categoryId: a.category_id ?? null,
      categoryLabel: a.category_id ? catLabel.get(a.category_id) ?? null : null,
      amount: Number(a.amount), currency: a.currency ?? currency, note: a.note ?? null, createdAt: a.created_at,
    }));
    const installments: StudentInstallment[] = (instRows ?? []).map((it: any) => ({
      id: it.id, studentId, categoryId: it.category_id ?? null,
      categoryLabel: it.category_id ? catLabel.get(it.category_id) ?? null : null,
      label: it.label ?? "Tranche", period: it.period ?? null, amount: Number(it.amount), currency: it.currency ?? currency,
      dueDate: it.due_date ?? null, paidAt: it.paid_at ?? null,
    }));

    // Agrégats par rubrique (avances + tranches).
    const advByCat = new Map<string, number>();
    for (const a of advances) if (a.categoryId) advByCat.set(a.categoryId, (advByCat.get(a.categoryId) ?? 0) + a.amount);
    const instByCat = new Map<string, { total: number; count: number; paid: number; paidCount: number }>();
    for (const it of installments) {
      if (!it.categoryId) continue;
      const e = instByCat.get(it.categoryId) ?? { total: 0, count: 0, paid: 0, paidCount: 0 };
      e.total += it.amount; e.count++;
      if (it.paidAt) { e.paid += it.amount; e.paidCount++; }
      instByCat.set(it.categoryId, e);
    }

    let totalDue = 0;
    const fees: StudentFeeLine[] = (feeRows ?? []).map((f: any) => {
      const cid = f.category_id ?? "";
      const amountDue = Number(f.amount_due);
      totalDue += amountDue;
      const adv = advByCat.get(cid) ?? 0;
      const inst = instByCat.get(cid) ?? { total: 0, count: 0, paid: 0, paidCount: 0 };
      const paid = adv + inst.paid;
      return {
        id: f.id, categoryId: f.category_id ?? null, label: f.label ?? "Frais",
        amountDue, advances: adv,
        echPaidCount: inst.paidCount, echTotalCount: inst.count, echPaidAmount: inst.paid, echTotalAmount: inst.total,
        paid, remaining: Math.max(0, amountDue - paid), currency: f.currency ?? currency,
      };
    });

    // Total payé = paiements ad hoc + avances + tranches payées.
    const adhoc = payments.reduce((a, p) => a + p.amount, 0);
    const advTotal = advances.reduce((a, x) => a + x.amount, 0);
    const instPaid = installments.reduce((a, x) => a + (x.paidAt ? x.amount : 0), 0);
    const totalPaid = adhoc + advTotal + instPaid;
    const todayStr = new Date().toISOString().slice(0, 10);
    const overdue = installments.some((it) => !it.paidAt && it.dueDate && it.dueDate < todayStr);

    const parent = ((links ?? []) as any[]).sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))[0];
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
      remaining: Math.max(0, totalDue - totalPaid),
      currency,
      paymentStatus: paymentStatusOf(totalDue, totalPaid),
      financeStatus: autoFinanceStatus(totalDue, totalPaid, overdue),
    };

    return { student, fees, payments, advances, installments };
  } catch {
    return null;
  }
}

// Listes école-wide pour les onglets Avances & Acomptes / Tranches & Échéances.
export async function getSchoolAdvances(): Promise<StudentAdvance[]> {
  if (!isLiveMode()) return MOCK_ADVANCES;
  try {
    const school = await getMySchool();
    if (!school) return [];
    const svc = service();
    const { data } = await svc.from("student_advances")
      .select("id, student_id, category_id, amount, currency, note, created_at, students(full_name, class_name, option), fee_categories(name)")
      .eq("school_id", school.id).order("created_at", { ascending: false });
    return (data ?? []).map((a: any) => ({
      id: a.id, studentId: a.student_id, categoryId: a.category_id ?? null,
      categoryLabel: a.fee_categories?.name ?? null, amount: Number(a.amount), currency: a.currency ?? "CDF",
      note: a.note ?? null, createdAt: a.created_at,
      studentName: a.students?.full_name ?? "—", className: classLabel(a.students?.class_name, a.students?.option),
    }));
  } catch { return []; }
}

export async function getSchoolInstallments(): Promise<StudentInstallment[]> {
  if (!isLiveMode()) return MOCK_INSTALLMENTS;
  try {
    const school = await getMySchool();
    if (!school) return [];
    const svc = service();
    const { data } = await svc.from("student_installments")
      .select("id, student_id, category_id, label, period, amount, currency, due_date, paid_at, students(full_name, class_name, option), fee_categories(name)")
      .eq("school_id", school.id).order("due_date");
    return (data ?? []).map((it: any) => ({
      id: it.id, studentId: it.student_id, categoryId: it.category_id ?? null,
      categoryLabel: it.fee_categories?.name ?? null, label: it.label ?? "Tranche", period: it.period ?? null, amount: Number(it.amount),
      currency: it.currency ?? "CDF", dueDate: it.due_date ?? null, paidAt: it.paid_at ?? null,
      studentName: it.students?.full_name ?? "—", className: classLabel(it.students?.class_name, it.students?.option),
    }));
  } catch { return []; }
}

// ─────────────────────────────────────────────────────────────────────
// Caisse — journal des dépenses & recettes
// ─────────────────────────────────────────────────────────────────────
export type CashEntry = {
  id: string;
  kind: "depense" | "recette";
  amount: number;
  currency: string;
  label: string;
  entryDate: string;
  signatory: string | null;
  note: string | null;
  createdAt: string;
};

export type CashSummary = { depenses: number; recettes: number; solde: number; currency: string };

export async function getCashEntries(): Promise<CashEntry[]> {
  if (!isLiveMode()) return MOCK_CASH;
  try {
    const school = await getMySchool();
    if (!school) return [];
    const svc = service();
    const { data } = await svc
      .from("cash_entries")
      .select("id, kind, amount, currency, label, entry_date, signatory, note, created_at")
      .eq("school_id", school.id)
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false });
    return (data ?? []).map((e: any) => ({
      id: e.id, kind: e.kind, amount: Number(e.amount), currency: e.currency ?? "CDF",
      label: e.label ?? "", entryDate: e.entry_date, signatory: e.signatory ?? null,
      note: e.note ?? null, createdAt: e.created_at,
    }));
  } catch { return []; }
}

export async function getCashSummary(): Promise<CashSummary> {
  const entries = await getCashEntries();
  const depenses = entries.filter((e) => e.kind === "depense").reduce((a, e) => a + e.amount, 0);
  const recettes = entries.filter((e) => e.kind === "recette").reduce((a, e) => a + e.amount, 0);
  const currency = entries[0]?.currency ?? "CDF";
  return { depenses, recettes, solde: recettes - depenses, currency };
}

// ─────────────────────────────────────────────────────────────────────
// Rappel de paiement — parents des élèves ayant un reste à payer
// ─────────────────────────────────────────────────────────────────────
export type ReminderRecipient = {
  studentId: string;
  studentName: string;
  className: string;
  remaining: number;
  currency: string;
  parentId: string;
  parentName: string;
  parentPhone: string | null;
};

// Tous les élèves actifs ayant un parent joignable (pour la barre de sélection
// du rappel). Le reste à payer est joint : l'UI pré-coche les débiteurs.
export async function getReminderRecipients(): Promise<ReminderRecipient[]> {
  if (!isLiveMode()) return [];
  try {
    const overview = await getFinanceOverview();
    const school = await getMySchool();
    if (!school || overview.students.length === 0) return [];
    const svc = service();
    const ids = overview.students.map((s) => s.id);
    const { data: links } = await svc
      .from("parent_links")
      .select("student_id, parent_id, is_primary, profiles!parent_links_parent_id_fkey(full_name, phone)")
      .in("student_id", ids);

    // Parent principal (ou premier) par élève.
    const parentByStudent = new Map<string, { id: string; name: string; phone: string | null }>();
    for (const l of (links ?? []) as any[]) {
      if (!parentByStudent.has(l.student_id) || l.is_primary) {
        parentByStudent.set(l.student_id, { id: l.parent_id, name: l.profiles?.full_name ?? "Parent", phone: l.profiles?.phone ?? null });
      }
    }

    const out: ReminderRecipient[] = [];
    for (const s of overview.students) {
      const p = parentByStudent.get(s.id);
      if (!p?.id) continue;
      out.push({
        studentId: s.id, studentName: s.fullName, className: s.className,
        remaining: s.remaining, currency: s.currency,
        parentId: p.id, parentName: p.name, parentPhone: p.phone,
      });
    }
    // Débiteurs d'abord, puis par classe / nom.
    out.sort((a, b) => (b.remaining > 0 ? 1 : 0) - (a.remaining > 0 ? 1 : 0) || a.className.localeCompare(b.className, "fr", { numeric: true }) || a.studentName.localeCompare(b.studentName));
    return out;
  } catch { return []; }
}

function buildOverview(rows: FinanceStudentRow[], currency: string): FinanceOverview {
  const totalDue = rows.reduce((a, r) => a + r.totalDue, 0);
  const totalPaid = rows.reduce((a, r) => a + Math.min(r.paid, r.totalDue || r.paid), 0);
  const pending = Math.max(0, totalDue - totalPaid);
  // « En attente non payé » : reste des élèves marqués non payés.
  const late = rows.filter((r) => r.financeStatus === "non_paye").reduce((a, r) => a + r.remaining, 0);

  const distribution = { paid: 0, partial: 0, unpaid: 0 };
  const situation = { enOrdre: 0, nonPaye: 0, insolvable: 0 };
  for (const r of rows) {
    distribution[donutBucket(r)]++;
    if (r.financeStatus === "insolvable") situation.insolvable++;
    else if (r.financeStatus === "non_paye") situation.nonPaye++;
    else situation.enOrdre++;
  }
  return { currency, kpis: { totalDue, totalPaid, pending, late }, students: rows, distribution, situation, total: rows.length };
}

function emptyOverview(): FinanceOverview {
  return { currency: "CDF", kpis: { totalDue: 0, totalPaid: 0, pending: 0, late: 0 }, students: [], distribution: { paid: 0, partial: 0, unpaid: 0 }, situation: { enOrdre: 0, nonPaye: 0, insolvable: 0 }, total: 0 };
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
const MOCK_STATUSES: FinanceStatus[] = ["en_ordre", "non_paye", "insolvable", "en_ordre", "non_paye", "en_ordre", "en_ordre", "en_ordre", "non_paye", "insolvable"];

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
  // Réparti le "payé" en avances puis tranches sur les rubriques (démo).
  let leftover = row.paid;
  const fees: StudentFeeLine[] = MOCK_CATEGORIES.map((c) => {
    const applied = Math.min(c.amount, Math.max(0, leftover));
    leftover -= applied;
    const advances = Math.round(applied * 0.2);
    const echPaidAmount = applied - advances;
    const echTotalAmount = Math.max(echPaidAmount, Math.round(c.amount * 0.6));
    const echTotalCount = echTotalAmount > 0 ? 2 : 0;
    const echPaidCount = echPaidAmount >= echTotalAmount && echTotalCount ? echTotalCount : echPaidAmount > 0 ? 1 : 0;
    return {
      id: c.id, categoryId: c.id, label: c.name, amountDue: c.amount,
      advances, echPaidCount, echTotalCount, echPaidAmount, echTotalAmount,
      paid: applied, remaining: Math.max(0, c.amount - applied), currency: "CDF",
    };
  });
  const advances: StudentAdvance[] = fees.filter((f) => f.advances > 0).map((f) => ({
    id: `adv-${f.id}`, studentId: row.id, categoryId: f.categoryId, categoryLabel: f.label,
    amount: f.advances, currency: "CDF", note: null, createdAt: new Date().toISOString(),
  }));
  const installments: StudentInstallment[] = fees.filter((f) => f.echTotalCount > 0).flatMap((f) =>
    Array.from({ length: f.echTotalCount }).map((_, i) => ({
      id: `inst-${f.id}-${i}`, studentId: row.id, categoryId: f.categoryId, categoryLabel: f.label,
      label: `Tranche ${i + 1}`, period: null, amount: Math.round(f.echTotalAmount / f.echTotalCount), currency: "CDF",
      dueDate: `2025-0${6 + i}-15`, paidAt: i < f.echPaidCount ? "2025-06-01" : null,
    }))
  );
  return { student: row, fees, payments: [], advances, installments };
}

const MOCK_ADVANCES: StudentAdvance[] = mockRows().slice(0, 4).map((r, i) => ({
  id: `adv-${i}`, studentId: r.id, categoryId: "c1", categoryLabel: "Frais de scolarité",
  amount: [10000, 15000, 5000, 20000][i], currency: "CDF", note: "Acompte", createdAt: "2025-06-0" + (i + 1),
  studentName: r.fullName, className: r.className,
}));

const MOCK_INSTALLMENTS: StudentInstallment[] = mockRows().slice(0, 5).map((r, i) => ({
  id: `inst-${i}`, studentId: r.id, categoryId: "c1", categoryLabel: "Frais de scolarité",
  label: `Tranche ${(i % 2) + 1}`, period: `Période ${(i % 2) + 1}`, amount: 25000, currency: "CDF",
  dueDate: `2025-0${6 + (i % 3)}-15`, paidAt: i % 2 === 0 ? "2025-06-10" : null,
  studentName: r.fullName, className: r.className,
}));

const MOCK_TEMPLATES: InstallmentTemplate[] = [
  { id: "t1", name: "1ère tranche", period: null, dateFrom: "2026-10-01", dateTo: "2026-12-31", amount: 100, currency: "USD", position: 0 },
  { id: "t2", name: "2ème tranche", period: null, dateFrom: "2027-01-01", dateTo: "2027-02-28", amount: 100, currency: "USD", position: 1 },
  { id: "t3", name: "3ème tranche", period: null, dateFrom: "2027-03-01", dateTo: "2027-04-05", amount: 50, currency: "USD", position: 2 },
];

const MOCK_CASH: CashEntry[] = [
  { id: "ce1", kind: "recette", amount: 250000, currency: "CDF", label: "Encaissement scolarité", entryDate: "2025-06-05", signatory: "La direction", note: null, createdAt: "2025-06-05" },
  { id: "ce2", kind: "depense", amount: 80000, currency: "CDF", label: "Achat fournitures", entryDate: "2025-06-07", signatory: "La direction", note: null, createdAt: "2025-06-07" },
  { id: "ce3", kind: "depense", amount: 45000, currency: "CDF", label: "Facture électricité", entryDate: "2025-06-10", signatory: "La direction", note: null, createdAt: "2025-06-10" },
];
