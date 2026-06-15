// Couche données — frais scolaires / minerval par élève (Lot B).
// Lecture via le client service (la table n'est pas dans les types générés ;
// le scope école est garanti par getMySchool + filtre school_id).

import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getMySchool, listSchoolStudents } from "@/lib/school-db";
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
        totals: e ? [...e.totals.entries()].map(([currency, total]) => ({ currency, total })) : [],
        count: e?.count ?? 0,
        lastPaidAt: e?.last ?? null,
      };
    });
  } catch {
    return [];
  }
}
