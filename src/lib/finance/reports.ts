// Module Finance v2 — couche données « Rapports » (par classe & par élève).
//
// Un rapport consolide TOUS les frais applicables à un élève : les frais ciblant
// sa classe + les frais « école entière » (autres frais sans classe). Attendu /
// payé / solde sont calculés depuis la source unique (fee_payments) et SÉPARÉS
// PAR DEVISE (USD / CDF…) — jamais additionnés entre devises.

import { serviceClient } from "@/lib/supabase/service";
import { getMySchool } from "@/lib/school/profile";
import { classLabel, normOption } from "@/lib/classes";
import { isLiveMode } from "@/lib/env";
import { schoolYearLabel } from "@/lib/trimester";
import type { FeeStudentStatus } from "./fees";

const statusOf = (expected: number, paid: number): FeeStudentStatus =>
  paid <= 0 ? "impaye" : expected - paid <= 0.001 ? "paye" : "partiel";

export type CurAmounts = { expected: number; paid: number; remaining: number };

export type ClassReportRow = {
  studentId: string;
  matricule: string;
  fullName: string;
  sex: string | null;
  byCurrency: Record<string, CurAmounts>;
  status: FeeStudentStatus;
};

export type ClassReport = {
  classDisplay: string;
  year: string;
  currencies: string[];
  rows: ClassReportRow[];
  totalsByCurrency: Record<string, CurAmounts>;
};

export type StudentReportFeeLine = {
  feeId: string;
  label: string;
  kind: string;
  currency: string;
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
  currencies: string[];
  fees: StudentReportFeeLine[];
  payments: StudentReportPayment[];
  totalsByCurrency: Record<string, CurAmounts>;
};

// Frais applicables à une classe : ciblant cette classe OU « école entière » (class null).
function feeAppliesToClass(f: any, className: string, option: string | null): boolean {
  if (!f.class_name) return true;
  return f.class_name === className && normOption(f.option) === normOption(option);
}

async function schoolFees(svc: ReturnType<typeof serviceClient>, schoolId: string, year: string) {
  const { data } = await svc
    .from("fees")
    .select("id, kind, label, class_name, option, school_year, total_amount, currency")
    .eq("school_id", schoolId)
    .eq("archived", false);
  return (data ?? []).filter((f: any) => !f.school_year || f.school_year === year);
}

function ensure(map: Record<string, CurAmounts>, cur: string): CurAmounts {
  if (!map[cur]) map[cur] = { expected: 0, paid: 0, remaining: 0 };
  return map[cur];
}
function totalOf(m: Record<string, CurAmounts>, key: keyof CurAmounts): number {
  return Object.values(m).reduce((a, v) => a + v[key], 0);
}

export async function getClassReport(className: string, option: string | null, year?: string): Promise<ClassReport> {
  const yr = year || schoolYearLabel();
  const display = classLabel(className, option);
  const empty: ClassReport = { classDisplay: display, year: yr, currencies: [], rows: [], totalsByCurrency: {} };
  if (!isLiveMode()) return empty;
  try {
    const school = await getMySchool();
    if (!school) return empty;
    const svc = serviceClient();
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
      feeIds.length ? svc.from("fee_payments").select("student_id, amount, currency").in("fee_id", feeIds).is("cancelled_at", null) : Promise.resolve({ data: [] as any[] }),
    ]);

    const ovr = new Map<string, number>();
    for (const o of (overrides ?? []) as any[]) ovr.set(`${o.fee_id}|${o.student_id}`, Number(o.amount));
    const paidByStudentCur = new Map<string, Record<string, number>>();
    for (const p of (pays ?? []) as any[]) {
      const m = paidByStudentCur.get(p.student_id) ?? {};
      m[p.currency ?? "CDF"] = (m[p.currency ?? "CDF"] ?? 0) + Number(p.amount);
      paidByStudentCur.set(p.student_id, m);
    }

    const totalsByCurrency: Record<string, CurAmounts> = {};
    const rows: ClassReportRow[] = inClass.map((s: any) => {
      const byCurrency: Record<string, CurAmounts> = {};
      for (const f of applicable) {
        const exp = ovr.has(`${f.id}|${s.id}`) ? ovr.get(`${f.id}|${s.id}`)! : Number(f.total_amount);
        ensure(byCurrency, f.currency ?? "CDF").expected += exp;
      }
      const paidMap = paidByStudentCur.get(s.id) ?? {};
      for (const [cur, amt] of Object.entries(paidMap)) ensure(byCurrency, cur).paid += amt;
      for (const cur of Object.keys(byCurrency)) {
        const e = byCurrency[cur];
        e.remaining = Math.max(0, e.expected - e.paid);
        const t = ensure(totalsByCurrency, cur);
        t.expected += e.expected; t.paid += Math.min(e.paid, e.expected || e.paid); t.remaining += e.remaining;
      }
      const totExp = totalOf(byCurrency, "expected"), totPaid = totalOf(byCurrency, "paid");
      return { studentId: s.id, matricule: s.matricule ?? "—", fullName: s.full_name, sex: s.sex ?? null, byCurrency, status: statusOf(totExp, totPaid) };
    });

    return { classDisplay: display, year: yr2, currencies: Object.keys(totalsByCurrency).sort(), rows, totalsByCurrency };
  } catch {
    return empty;
  }
}

export async function getStudentReport(studentId: string, year?: string): Promise<StudentReport | null> {
  if (!isLiveMode() || !studentId) return null;
  try {
    const school = await getMySchool();
    if (!school) return null;
    const svc = serviceClient();
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

    const totalsByCurrency: Record<string, CurAmounts> = {};
    const feeLines: StudentReportFeeLine[] = fees.map((f: any) => {
      const cur = f.currency ?? "CDF";
      const expected = ovr.has(f.id) ? ovr.get(f.id)! : Number(f.total_amount);
      const paid = paidByFee.get(f.id) ?? 0;
      const remaining = Math.max(0, expected - paid);
      const t = ensure(totalsByCurrency, cur);
      t.expected += expected; t.paid += Math.min(paid, expected || paid); t.remaining += remaining;
      return { feeId: f.id, label: f.label, kind: f.kind, currency: cur, expected, paid, remaining, status: statusOf(expected, paid) };
    });
    const payments: StudentReportPayment[] = (pays ?? []).map((p: any) => ({
      id: p.id, feeLabel: p.fees?.label ?? "Frais", installmentName: p.fee_installments?.name ?? null,
      amount: Number(p.amount), currency: p.currency ?? "CDF", paidAt: p.paid_at,
      invoiceNo: p.invoice_no ?? null, cashierName: p.cashier_name ?? null, cancelledAt: p.cancelled_at ?? null,
    }));

    return {
      studentId, fullName: (s as any).full_name, matricule: (s as any).matricule ?? "—", classDisplay: classLabel(className, option),
      year: yr, currencies: Object.keys(totalsByCurrency).sort(), fees: feeLines, payments, totalsByCurrency,
    };
  } catch {
    return null;
  }
}
