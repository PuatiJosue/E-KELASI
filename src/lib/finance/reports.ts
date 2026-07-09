// Module Finance v2 — couche données « Rapports » (par classe & par élève).
//
// Un rapport consolide TOUS les frais applicables à un élève : les frais ciblant
// sa classe + les frais « école entière » (autres frais sans classe). Attendu /
// payé / solde / statut sont calculés depuis la source unique (fee_payments).

import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getMySchool } from "@/lib/school-db";
import { classLabel, normOption } from "@/lib/classes";
import { isLiveMode } from "@/lib/db";
import { schoolYearLabel } from "@/lib/trimester";
import type { FeeStudentStatus } from "./fees";

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

const statusOf = (expected: number, paid: number): FeeStudentStatus =>
  paid <= 0 ? "impaye" : expected - paid <= 0.001 ? "paye" : "partiel";

export type ClassReportRow = {
  studentId: string;
  matricule: string;
  fullName: string;
  sex: string | null;
  expected: number;
  paid: number;
  remaining: number;
  status: FeeStudentStatus;
};

export type ClassReport = {
  classDisplay: string;
  year: string;
  currency: string;
  rows: ClassReportRow[];
  totals: { expected: number; paid: number; remaining: number };
};

export type StudentReportFeeLine = {
  feeId: string;
  label: string;
  kind: string;
  expected: number;
  paid: number;
  remaining: number;
  status: FeeStudentStatus;
};

export type StudentReportPayment = {
  id: string;
  feeLabel: string;
  installmentName: string | null;
  amount: number;
  currency: string;
  paidAt: string;
  invoiceNo: string | null;
  cashierName: string | null;
  cancelledAt: string | null;
};

export type StudentReport = {
  studentId: string;
  fullName: string;
  matricule: string;
  classDisplay: string;
  year: string;
  currency: string;
  fees: StudentReportFeeLine[];
  payments: StudentReportPayment[];
  totals: { expected: number; paid: number; remaining: number };
};

// Frais applicables à une classe : ciblant cette classe OU « école entière » (class null).
function feeAppliesToClass(f: any, className: string, option: string | null): boolean {
  if (!f.class_name) return true; // école entière
  return f.class_name === className && normOption(f.option) === normOption(option);
}

async function schoolFees(svc: ReturnType<typeof service>, schoolId: string, year: string) {
  const { data } = await svc
    .from("fees")
    .select("id, kind, label, class_name, option, school_year, total_amount, currency")
    .eq("school_id", schoolId)
    .eq("archived", false);
  return (data ?? []).filter((f: any) => !f.school_year || f.school_year === year);
}

export async function getClassReport(className: string, option: string | null, year?: string): Promise<ClassReport> {
  const yr = year || schoolYearLabel();
  const display = classLabel(className, option);
  if (!isLiveMode()) return { classDisplay: display, year: yr, currency: "CDF", rows: [], totals: { expected: 0, paid: 0, remaining: 0 } };
  try {
    const school = await getMySchool();
    if (!school) throw new Error("no school");
    const svc = service();
    const yr2 = year || school.currentYear || schoolYearLabel();

    const [{ data: students }, fees] = await Promise.all([
      svc.from("students").select("id, full_name, matricule, class_name, option, sex").eq("school_id", school.id).eq("status", "active").eq("class_name", className).order("full_name"),
      schoolFees(svc, school.id, yr2),
    ]);
    const inClass = (students ?? []).filter((s: any) => normOption(s.option) === normOption(option));
    const applicable = fees.filter((f: any) => feeAppliesToClass(f, className, option));
    const feeIds = applicable.map((f: any) => f.id);

    const [{ data: overrides }, { data: pays }] = await Promise.all([
      feeIds.length ? svc.from("fee_overrides").select("fee_id, student_id, amount").in("fee_id", feeIds) : Promise.resolve({ data: [] as any[] }),
      feeIds.length ? svc.from("fee_payments").select("student_id, amount").in("fee_id", feeIds).is("cancelled_at", null) : Promise.resolve({ data: [] as any[] }),
    ]);

    const ovr = new Map<string, number>(); // key fee|student
    for (const o of (overrides ?? []) as any[]) ovr.set(`${o.fee_id}|${o.student_id}`, Number(o.amount));
    const paidBy = new Map<string, number>();
    for (const p of (pays ?? []) as any[]) paidBy.set(p.student_id, (paidBy.get(p.student_id) ?? 0) + Number(p.amount));

    const currency = applicable[0]?.currency ?? "CDF";
    const rows: ClassReportRow[] = inClass.map((s: any) => {
      let expected = 0;
      for (const f of applicable) expected += ovr.has(`${f.id}|${s.id}`) ? ovr.get(`${f.id}|${s.id}`)! : Number(f.total_amount);
      const paid = paidBy.get(s.id) ?? 0;
      return {
        studentId: s.id, matricule: s.matricule ?? "—", fullName: s.full_name, sex: s.sex ?? null,
        expected, paid, remaining: Math.max(0, expected - paid), status: statusOf(expected, paid),
      };
    });
    const totals = rows.reduce((a, r) => ({ expected: a.expected + r.expected, paid: a.paid + Math.min(r.paid, r.expected || r.paid), remaining: a.remaining + r.remaining }), { expected: 0, paid: 0, remaining: 0 });
    return { classDisplay: display, year: yr2, currency, rows, totals };
  } catch {
    return { classDisplay: display, year: yr, currency: "CDF", rows: [], totals: { expected: 0, paid: 0, remaining: 0 } };
  }
}

export async function getStudentReport(studentId: string, year?: string): Promise<StudentReport | null> {
  if (!isLiveMode() || !studentId) return null;
  try {
    const school = await getMySchool();
    if (!school) return null;
    const svc = service();
    const yr = year || school.currentYear || schoolYearLabel();

    const { data: s } = await svc.from("students").select("id, full_name, matricule, class_name, option, sex").eq("id", studentId).eq("school_id", school.id).maybeSingle();
    if (!s) return null;
    const className = (s as any).class_name as string, option = (s as any).option as string | null;

    const fees = (await schoolFees(svc, school.id, yr)).filter((f: any) => feeAppliesToClass(f, className, option));
    const feeIds = fees.map((f: any) => f.id);
    const [{ data: overrides }, { data: pays }] = await Promise.all([
      feeIds.length ? svc.from("fee_overrides").select("fee_id, amount").in("fee_id", feeIds).eq("student_id", studentId) : Promise.resolve({ data: [] as any[] }),
      feeIds.length ? svc.from("fee_payments").select("id, fee_id, amount, currency, paid_at, invoice_no, cashier_name, cancelled_at, fees(label), fee_installments(name)").in("fee_id", feeIds).eq("student_id", studentId).order("paid_at", { ascending: false }) : Promise.resolve({ data: [] as any[] }),
    ]);
    const ovr = new Map<string, number>();
    for (const o of (overrides ?? []) as any[]) ovr.set(o.fee_id, Number(o.amount));
    const paidByFee = new Map<string, number>();
    for (const p of (pays ?? []) as any[]) if (!p.cancelled_at) paidByFee.set(p.fee_id, (paidByFee.get(p.fee_id) ?? 0) + Number(p.amount));

    const currency = fees[0]?.currency ?? "CDF";
    const feeLines: StudentReportFeeLine[] = fees.map((f: any) => {
      const expected = ovr.has(f.id) ? ovr.get(f.id)! : Number(f.total_amount);
      const paid = paidByFee.get(f.id) ?? 0;
      return { feeId: f.id, label: f.label, kind: f.kind, expected, paid, remaining: Math.max(0, expected - paid), status: statusOf(expected, paid) };
    });
    const payments: StudentReportPayment[] = (pays ?? []).map((p: any) => ({
      id: p.id, feeLabel: p.fees?.label ?? "Frais", installmentName: p.fee_installments?.name ?? null,
      amount: Number(p.amount), currency: p.currency ?? currency, paidAt: p.paid_at,
      invoiceNo: p.invoice_no ?? null, cashierName: p.cashier_name ?? null, cancelledAt: p.cancelled_at ?? null,
    }));
    const totals = feeLines.reduce((a, l) => ({ expected: a.expected + l.expected, paid: a.paid + Math.min(l.paid, l.expected || l.paid), remaining: a.remaining + l.remaining }), { expected: 0, paid: 0, remaining: 0 });

    return {
      studentId, fullName: (s as any).full_name, matricule: (s as any).matricule ?? "—", classDisplay: classLabel(className, option),
      year: yr, currency, fees: feeLines, payments, totals,
    };
  } catch {
    return null;
  }
}
