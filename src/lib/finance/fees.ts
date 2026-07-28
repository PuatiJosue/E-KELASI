// Module Finance v2 — couche données « Frais » (scolaires & autres).
//
// Source unique : les encaissements vivent dans `fee_payments`. Attendu / encaissé
// / restant / impayés / % de recouvrement sont TOUJOURS calculés ici, jamais saisis.
// Accès via le client service (scope garanti par getMySchool + filtre school_id),
// comme le reste du module.

import { serviceClient } from "@/lib/supabase/service";
import { getMySchool } from "@/lib/school/profile";
import { classLabel, normOption } from "@/lib/classes";
import { isLiveMode } from "@/lib/env";
import { schoolYearLabel } from "@/lib/trimester";
import { emptyOverview, mockOverview } from "./fees-mock";

export type FeeKind = "scolaire" | "autre";
export type FeeStudentStatus = "paye" | "partiel" | "impaye";

export type FeeInstallment = {
  id: string;
  name: string;
  position: number;
  amount: number;
  dueDate: string | null;
};

export type Fee = {
  id: string;
  kind: FeeKind;
  label: string;
  category: string | null;
  className: string | null;
  option: string | null;
  classDisplay: string | null;
  schoolYear: string | null;
  totalAmount: number;
  currency: string;
  dueDate: string | null;   // échéance globale du frais (facultative)
  position: number;
  archived: boolean;
  installments: FeeInstallment[];
  // agrégats calculés
  studentCount: number;
  expected: number;
  collected: number;
  remaining: number;
  recoveryPct: number;
  unpaidCount: number;   // élèves non totalement soldés
  paidCount: number;
  partialCount: number;
  hasPayments: boolean;  // verrouille modification/suppression
};

export type FeesOverview = {
  currency: string;
  year: string;
  kpis: { expected: number; collected: number; remaining: number; recoveryPct: number };
  fees: Fee[];
  // Graphique attendu / encaissé / impayés, par frais (top) ou global
  chart: { label: string; expected: number; collected: number; remaining: number }[];
};

export type FeeStudentRow = {
  studentId: string;
  matricule: string;
  fullName: string;
  avatarUrl: string | null;
  sex: string | null;
  classDisplay: string;
  expected: number;
  paid: number;
  remaining: number;
  currency: string;
  status: FeeStudentStatus;
  overrideAmount: number | null;
  lastPaidAt: string | null;
};

export type FeeDetail = {
  fee: Fee;
  students: FeeStudentRow[];
};

export const statusOf = (expected: number, paid: number): FeeStudentStatus =>
  paid <= 0 ? "impaye" : expected - paid <= 0.001 ? "paye" : "partiel";

// Élèves actifs ciblés par un frais (classe précise ou école entière si class null).
export async function targetStudents(
  svc: ReturnType<typeof serviceClient>,
  schoolId: string,
  className: string | null,
  option: string | null
) {
  let q = svc
    .from("students")
    .select("id, full_name, matricule, class_name, option, sex, avatar_url")
    .eq("school_id", schoolId)
    .eq("status", "active");
  if (className) q = q.eq("class_name", className);
  const { data } = await q.order("full_name");
  const opt = normOption(option);
  return (data ?? []).filter((s: any) =>
    className ? normOption(s.option) === opt : true
  );
}

export function mapFeeRow(f: any): Omit<Fee, keyof FeeAggregates> {
  return {
    id: f.id,
    kind: (f.kind ?? "scolaire") as FeeKind,
    label: f.label ?? "Frais",
    category: f.category ?? null,
    className: f.class_name ?? null,
    option: f.option ?? null,
    classDisplay: f.class_name ? classLabel(f.class_name, f.option) : null,
    schoolYear: f.school_year ?? null,
    totalAmount: Number(f.total_amount ?? 0),
    currency: f.currency ?? "CDF",
    dueDate: f.due_date ?? null,
    position: f.position ?? 0,
    archived: !!f.archived,
    installments: [],
  };
}

export type FeeAggregates = {
  studentCount: number; expected: number; collected: number; remaining: number;
  recoveryPct: number; unpaidCount: number; paidCount: number; partialCount: number; hasPayments: boolean;
};

// Vue d'ensemble d'une rubrique (scolaire | autre) pour une année.
export async function getFeesOverview(kind: FeeKind, year?: string): Promise<FeesOverview> {
  if (!isLiveMode()) return mockOverview(kind, year);
  try {
    const school = await getMySchool();
    if (!school) return emptyOverview(year);
    const svc = serviceClient();
    const yr = year || school.currentYear || schoolYearLabel();

    const { data: feeRows } = await svc
      .from("fees")
      .select("id, kind, label, category, class_name, option, school_year, total_amount, currency, due_date, position, archived")
      .eq("school_id", school.id)
      .eq("kind", kind)
      .order("position")
      .order("created_at");

    const fees = (feeRows ?? []).filter((f: any) => !year || f.school_year === yr || !f.school_year);
    const feeIds = fees.map((f: any) => f.id);

    const [{ data: insts }, { data: overrides }, { data: pays }] = await Promise.all([
      feeIds.length ? svc.from("fee_installments").select("id, fee_id, name, position, amount, due_date").in("fee_id", feeIds) : Promise.resolve({ data: [] as any[] }),
      feeIds.length ? svc.from("fee_overrides").select("fee_id, student_id, amount").in("fee_id", feeIds) : Promise.resolve({ data: [] as any[] }),
      feeIds.length ? svc.from("fee_payments").select("fee_id, student_id, amount").in("fee_id", feeIds).is("cancelled_at", null) : Promise.resolve({ data: [] as any[] }),
    ]);

    // Élèves ciblés par frais (regroupés par identité de classe pour limiter les requêtes).
    const built: Fee[] = [];
    for (const f of fees) {
      const students = await targetStudents(svc, school.id, f.class_name ?? null, f.option ?? null);
      const ovr = new Map<string, number>();
      for (const o of (overrides ?? []) as any[]) if (o.fee_id === f.id) ovr.set(o.student_id, Number(o.amount));
      const paidByStudent = new Map<string, number>();
      for (const p of (pays ?? []) as any[]) if (p.fee_id === f.id) paidByStudent.set(p.student_id, (paidByStudent.get(p.student_id) ?? 0) + Number(p.amount));

      let expected = 0, collected = 0, paidCount = 0, partialCount = 0, unpaidCount = 0;
      for (const s of students) {
        const exp = ovr.has(s.id) ? ovr.get(s.id)! : Number(f.total_amount ?? 0);
        const paid = Math.min(paidByStudent.get(s.id) ?? 0, exp || (paidByStudent.get(s.id) ?? 0));
        expected += exp; collected += paid;
        const st = statusOf(exp, paidByStudent.get(s.id) ?? 0);
        if (st === "paye") paidCount++; else if (st === "partiel") partialCount++; else unpaidCount++;
      }
      const remaining = Math.max(0, expected - collected);
      const feeInstallments: FeeInstallment[] = (insts ?? [])
        .filter((i: any) => i.fee_id === f.id)
        .map((i: any) => ({ id: i.id, name: i.name, position: i.position ?? 0, amount: Number(i.amount), dueDate: i.due_date ?? null }))
        .sort((a: FeeInstallment, b: FeeInstallment) => a.position - b.position);

      built.push({
        ...mapFeeRow(f),
        installments: feeInstallments,
        studentCount: students.length,
        expected, collected, remaining,
        recoveryPct: expected > 0 ? (collected / expected) * 100 : 0,
        unpaidCount, paidCount, partialCount,
        hasPayments: [...paidByStudent.values()].some((v) => v > 0),
      });
    }

    const currency = built[0]?.currency ?? "CDF";
    const kExpected = built.reduce((a, f) => a + f.expected, 0);
    const kCollected = built.reduce((a, f) => a + f.collected, 0);
    const kRemaining = Math.max(0, kExpected - kCollected);
    const chart = built.slice(0, 8).map((f) => ({
      label: f.label, expected: f.expected, collected: f.collected, remaining: f.remaining,
    }));

    return {
      currency, year: yr,
      kpis: { expected: kExpected, collected: kCollected, remaining: kRemaining, recoveryPct: kExpected > 0 ? (kCollected / kExpected) * 100 : 0 },
      fees: built, chart,
    };
  } catch {
    return emptyOverview(year);
  }
}
