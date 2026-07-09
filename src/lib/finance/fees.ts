// Module Finance v2 — couche données « Frais » (scolaires & autres).
//
// Source unique : les encaissements vivent dans `fee_payments`. Attendu / encaissé
// / restant / impayés / % de recouvrement sont TOUJOURS calculés ici, jamais saisis.
// Accès via le client service (scope garanti par getMySchool + filtre school_id),
// comme le reste du module (voir src/lib/finance-db.ts).

import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getMySchool } from "@/lib/school-db";
import { classLabel, normOption } from "@/lib/classes";
import { isLiveMode } from "@/lib/db";
import { schoolYearLabel } from "@/lib/trimester";

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

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

const statusOf = (expected: number, paid: number): FeeStudentStatus =>
  paid <= 0 ? "impaye" : expected - paid <= 0.001 ? "paye" : "partiel";

// Élèves actifs ciblés par un frais (classe précise ou école entière si class null).
async function targetStudents(
  svc: ReturnType<typeof service>,
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

function mapFeeRow(f: any): Omit<Fee, keyof FeeAggregates> {
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
    position: f.position ?? 0,
    archived: !!f.archived,
    installments: [],
  };
}

type FeeAggregates = {
  studentCount: number; expected: number; collected: number; remaining: number;
  recoveryPct: number; unpaidCount: number; paidCount: number; partialCount: number; hasPayments: boolean;
};

// Vue d'ensemble d'une rubrique (scolaire | autre) pour une année.
export async function getFeesOverview(kind: FeeKind, year?: string): Promise<FeesOverview> {
  if (!isLiveMode()) return mockOverview(kind, year);
  try {
    const school = await getMySchool();
    if (!school) return emptyOverview(year);
    const svc = service();
    const yr = year || school.currentYear || schoolYearLabel();

    const { data: feeRows } = await svc
      .from("fees")
      .select("id, kind, label, category, class_name, option, school_year, total_amount, currency, position, archived")
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

// Détail d'un frais : situation par élève.
export async function getFeeDetail(feeId: string): Promise<FeeDetail | null> {
  if (!isLiveMode()) return mockDetail(feeId);
  try {
    const school = await getMySchool();
    if (!school || !feeId) return null;
    const svc = service();

    const { data: f } = await svc
      .from("fees")
      .select("id, kind, label, category, class_name, option, school_year, total_amount, currency, position, archived")
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

// ── Mocks (mode démo) ────────────────────────────────────────────────
function emptyOverview(year?: string): FeesOverview {
  return { currency: "CDF", year: year || schoolYearLabel(), kpis: { expected: 0, collected: 0, remaining: 0, recoveryPct: 0 }, fees: [], chart: [] };
}

const MOCK_CLASSES = ["5ème A", "4ème B", "3ème A"];
function mockFee(kind: FeeKind, i: number): Fee {
  const totalAmount = kind === "scolaire" ? 250000 : [30000, 15000, 20000][i % 3];
  const studentCount = [12, 10, 8][i % 3];
  const collected = Math.round(totalAmount * studentCount * [0.7, 0.45, 0.3][i % 3]);
  const expected = totalAmount * studentCount;
  const labelS = ["Minerval", "Frais d'examen", "Assurance"][i % 3];
  const labelA = ["Uniforme", "Transport", "Cantine"][i % 3];
  return {
    id: `mock-fee-${kind}-${i}`, kind, label: kind === "scolaire" ? labelS : labelA,
    category: kind === "autre" ? labelA : null,
    className: MOCK_CLASSES[i % 3], option: null, classDisplay: MOCK_CLASSES[i % 3],
    schoolYear: schoolYearLabel(), totalAmount, currency: "CDF", position: i, archived: false,
    installments: kind === "scolaire" ? [
      { id: `mi-${i}-1`, name: "1ère tranche", position: 0, amount: Math.round(totalAmount / 2), dueDate: "2026-10-15" },
      { id: `mi-${i}-2`, name: "2ème tranche", position: 1, amount: Math.round(totalAmount / 2), dueDate: "2027-01-15" },
    ] : [],
    studentCount, expected, collected, remaining: expected - collected,
    recoveryPct: (collected / expected) * 100,
    unpaidCount: Math.round(studentCount * 0.3), paidCount: Math.round(studentCount * 0.5), partialCount: Math.round(studentCount * 0.2),
    hasPayments: collected > 0,
  };
}
function mockOverview(kind: FeeKind, year?: string): FeesOverview {
  const fees = [0, 1, 2].map((i) => mockFee(kind, i));
  const expected = fees.reduce((a, f) => a + f.expected, 0);
  const collected = fees.reduce((a, f) => a + f.collected, 0);
  return {
    currency: "CDF", year: year || schoolYearLabel(),
    kpis: { expected, collected, remaining: Math.max(0, expected - collected), recoveryPct: expected > 0 ? (collected / expected) * 100 : 0 },
    fees, chart: fees.map((f) => ({ label: f.label, expected: f.expected, collected: f.collected, remaining: f.remaining })),
  };
}
function mockDetail(feeId: string): FeeDetail {
  const kind: FeeKind = feeId.includes("autre") ? "autre" : "scolaire";
  const fee = mockFee(kind, 0);
  fee.id = feeId;
  const names: [string, string, string][] = [
    ["Diallo", "Moussa", "M"], ["Koné", "Aïssata", "F"], ["Traoré", "Ibrahim", "M"],
    ["Camara", "Fatou", "F"], ["Sow", "Amadou", "M"], ["Baldé", "Mariama", "F"],
  ];
  const students: FeeStudentRow[] = names.map(([last, first, sex], i) => {
    const expected = fee.totalAmount;
    const paid = [expected, expected / 2, 0, expected, expected / 4, 0][i] ?? 0;
    return {
      studentId: `mock-s-${i}`, matricule: `ELV-${125 + i}`, fullName: `${last} ${first}`,
      avatarUrl: null, sex, classDisplay: fee.classDisplay ?? "—",
      expected, paid, remaining: Math.max(0, expected - paid), currency: fee.currency,
      status: statusOf(expected, paid), overrideAmount: null, lastPaidAt: paid > 0 ? "2026-10-12" : null,
    };
  });
  return { fee, students };
}
