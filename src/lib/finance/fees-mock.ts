// Données de démonstration du module Frais (mode non connecté).

import { schoolYearLabel } from "@/lib/trimester";
import { statusOf } from "./fees";
import type { Fee, FeesOverview, FeeStudentRow, FeeDetail, FeeKind } from "./fees";

export function emptyOverview(year?: string): FeesOverview {
  return { currency: "CDF", year: year || schoolYearLabel(), kpis: { expected: 0, collected: 0, remaining: 0, recoveryPct: 0 }, fees: [], chart: [] };
}

export const MOCK_CLASSES = ["5ème A", "4ème B", "3ème A"];
export function mockFee(kind: FeeKind, i: number): Fee {
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
    schoolYear: schoolYearLabel(), totalAmount, currency: "CDF", dueDate: null, position: i, archived: false,
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
export function mockOverview(kind: FeeKind, year?: string): FeesOverview {
  const fees = [0, 1, 2].map((i) => mockFee(kind, i));
  const expected = fees.reduce((a, f) => a + f.expected, 0);
  const collected = fees.reduce((a, f) => a + f.collected, 0);
  return {
    currency: "CDF", year: year || schoolYearLabel(),
    kpis: { expected, collected, remaining: Math.max(0, expected - collected), recoveryPct: expected > 0 ? (collected / expected) * 100 : 0 },
    fees, chart: fees.map((f) => ({ label: f.label, expected: f.expected, collected: f.collected, remaining: f.remaining })),
  };
}
export function mockDetail(feeId: string): FeeDetail {
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
