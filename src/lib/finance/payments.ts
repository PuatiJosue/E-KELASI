// Module Finance v2 — couche données « Encaissements » (source unique).
//
// Historique des paiements (par frais / par élève), y compris les paiements annulés
// (soft delete) pour la traçabilité. Sert au détail d'un frais, aux factures et aux
// rapports par élève.

import { serviceClient } from "@/lib/supabase/service";
import { getMySchool } from "@/lib/school/profile";
import { isLiveMode } from "@/lib/env";

export type FeePayment = {
  id: string;
  feeId: string;
  feeLabel: string;
  studentId: string;
  studentName: string;
  classDisplay: string | null;
  installmentId: string | null;
  installmentName: string | null;
  amount: number;
  currency: string;
  paidAt: string;
  invoiceNo: string | null;
  cashierName: string | null;
  note: string | null;
  recordedBy: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
};

function mapPayment(p: any): FeePayment {
  return {
    id: p.id,
    feeId: p.fee_id,
    feeLabel: p.fees?.label ?? "Frais",
    studentId: p.student_id,
    studentName: p.students?.full_name ?? "—",
    classDisplay: p.students?.class_name ?? null,
    installmentId: p.installment_id ?? null,
    installmentName: p.fee_installments?.name ?? null,
    amount: Number(p.amount),
    currency: p.currency ?? "CDF",
    paidAt: p.paid_at,
    invoiceNo: p.invoice_no ?? null,
    cashierName: p.cashier_name ?? null,
    note: p.note ?? null,
    recordedBy: p.profiles?.full_name ?? null,
    cancelledAt: p.cancelled_at ?? null,
    cancelReason: p.cancel_reason ?? null,
  };
}

const SELECT =
  "id, fee_id, student_id, installment_id, amount, currency, paid_at, invoice_no, cashier_name, note, cancelled_at, cancel_reason, " +
  "fees(label), students(full_name, class_name, option), fee_installments(name), profiles:recorded_by(full_name)";

// Paiements d'un frais (option : un seul élève). Inclut les annulés.
export async function listFeePayments(feeId: string, studentId?: string): Promise<FeePayment[]> {
  if (!isLiveMode()) return [];
  try {
    const school = await getMySchool();
    if (!school || !feeId) return [];
    const svc = serviceClient();
    let q = svc.from("fee_payments").select(SELECT).eq("school_id", school.id).eq("fee_id", feeId);
    if (studentId) q = q.eq("student_id", studentId);
    const { data } = await q.order("paid_at", { ascending: false });
    return (data ?? []).map(mapPayment);
  } catch {
    return [];
  }
}

// Tous les paiements d'un élève (rapports). Inclut les annulés.
export async function listStudentFeePayments(studentId: string): Promise<FeePayment[]> {
  if (!isLiveMode()) return [];
  try {
    const school = await getMySchool();
    if (!school || !studentId) return [];
    const svc = serviceClient();
    const { data } = await svc
      .from("fee_payments").select(SELECT)
      .eq("school_id", school.id).eq("student_id", studentId)
      .order("paid_at", { ascending: false });
    return (data ?? []).map(mapPayment);
  } catch {
    return [];
  }
}
