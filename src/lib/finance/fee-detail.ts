// Détail d'un frais : situation par élève et paiements associés.

import { serviceClient } from "@/lib/supabase/service";
import { getMySchool } from "@/lib/school/profile";
import { classLabel, normOption } from "@/lib/classes";
import { isLiveMode } from "@/lib/env";
import { statusOf, targetStudents, mapFeeRow } from "./fees";
import { mockDetail } from "./fees-mock";
import type { Fee, FeeInstallment, FeeStudentRow, FeeDetail } from "./fees";

// Détail d'un frais : situation par élève.
export async function getFeeDetail(feeId: string): Promise<FeeDetail | null> {
  if (!isLiveMode()) return mockDetail(feeId);
  try {
    const school = await getMySchool();
    if (!school || !feeId) return null;
    const svc = serviceClient();

    const { data: f } = await svc
      .from("fees")
      .select("id, kind, label, category, class_name, option, school_year, total_amount, currency, due_date, position, archived")
      .eq("id", feeId).eq("school_id", school.id).maybeSingle();
    if (!f) return null;

    const [{ data: insts }, { data: overrides }, { data: pays }, students] = await Promise.all([
      svc.from("fee_installments").select("id, name, position, amount, due_date").eq("fee_id", feeId),
      svc.from("fee_overrides").select("student_id, amount").eq("fee_id", feeId),
      svc.from("fee_payments").select("student_id, amount, paid_at").eq("fee_id", feeId).is("cancelled_at", null),
      targetStudents(svc, school.id, (f as any).class_name ?? null, (f as any).option ?? null),
    ]);

    const ovr = new Map<string, number>();
    for (const o of (overrides ?? []) as any[]) ovr.set(o.student_id, Number(o.amount));
    const paidByStudent = new Map<string, number>();
    const lastByStudent = new Map<string, string>();
    for (const p of (pays ?? []) as any[]) {
      paidByStudent.set(p.student_id, (paidByStudent.get(p.student_id) ?? 0) + Number(p.amount));
      const d = p.paid_at as string;
      if (!lastByStudent.has(p.student_id) || d > lastByStudent.get(p.student_id)!) lastByStudent.set(p.student_id, d);
    }

    const totalAmount = Number((f as any).total_amount ?? 0);
    const currency = (f as any).currency ?? "CDF";
    const rows: FeeStudentRow[] = students.map((s: any) => {
      const expected = ovr.has(s.id) ? ovr.get(s.id)! : totalAmount;
      const paid = paidByStudent.get(s.id) ?? 0;
      return {
        studentId: s.id,
        matricule: s.matricule ?? "—",
        fullName: s.full_name,
        avatarUrl: s.avatar_url ?? null,
        sex: s.sex ?? null,
        classDisplay: classLabel(s.class_name, s.option),
        expected, paid, remaining: Math.max(0, expected - paid), currency,
        status: statusOf(expected, paid),
        overrideAmount: ovr.has(s.id) ? ovr.get(s.id)! : null,
        lastPaidAt: lastByStudent.get(s.id) ?? null,
      };
    });

    const feeInstallments: FeeInstallment[] = (insts ?? [])
      .map((i: any) => ({ id: i.id, name: i.name, position: i.position ?? 0, amount: Number(i.amount), dueDate: i.due_date ?? null }))
      .sort((a: FeeInstallment, b: FeeInstallment) => a.position - b.position);

    const expected = rows.reduce((a, r) => a + r.expected, 0);
    const collected = rows.reduce((a, r) => a + Math.min(r.paid, r.expected || r.paid), 0);
    const fee: Fee = {
      ...mapFeeRow(f),
      installments: feeInstallments,
      studentCount: rows.length,
      expected, collected, remaining: Math.max(0, expected - collected),
      recoveryPct: expected > 0 ? (collected / expected) * 100 : 0,
      unpaidCount: rows.filter((r) => r.status === "impaye").length,
      paidCount: rows.filter((r) => r.status === "paye").length,
      partialCount: rows.filter((r) => r.status === "partiel").length,
      hasPayments: [...paidByStudent.values()].some((v) => v > 0),
    };
    return { fee, students: rows };
  } catch {
    return null;
  }
}
