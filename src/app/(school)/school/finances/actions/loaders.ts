"use server";

// Loaders rappelés depuis le client (les composants ne parlent pas à la base).

import { getFeeDetail } from "@/lib/finance/fee-detail";
import type { FeeDetail } from "@/lib/finance/fees";
import { listFeePayments, type FeePayment } from "@/lib/finance/payments";
import { getClassReport, getStudentReport, type ClassReport, type StudentReport } from "@/lib/finance/reports";
import { getCashState, type CashState } from "@/lib/finance/cash-session";

// ── Loaders (server actions rappelées côté client) ───────────────────
export async function loadFeeDetail(feeId: string): Promise<FeeDetail | null> {
  if (!feeId) return null;
  return getFeeDetail(feeId);
}

export async function loadFeePayments(feeId: string, studentId?: string): Promise<FeePayment[]> {
  if (!feeId) return [];
  return listFeePayments(feeId, studentId);
}

export async function loadClassReport(className: string, option: string | null, year?: string): Promise<ClassReport> {
  return getClassReport(className, option, year);
}

export async function loadStudentReport(studentId: string, year?: string): Promise<StudentReport | null> {
  if (!studentId) return null;
  return getStudentReport(studentId, year);
}

export async function loadCashState(): Promise<CashState> {
  return getCashState();
}

