"use server";

import { revalidatePath } from "next/cache";
import { serviceClient } from "@/lib/supabase/service";
import { isLiveMode } from "@/lib/env";
import { getFeeDetail, type FeeDetail, type FeeKind } from "@/lib/finance/fees";
import { listFeePayments, type FeePayment } from "@/lib/finance/payments";
import { computeDayTotals, getCashState, type TreasuryKind, type CashState } from "@/lib/finance/treasury";
import { getClassReport, getStudentReport, type ClassReport, type StudentReport } from "@/lib/finance/reports";
import { requireSchoolAdmin } from "@/lib/auth/guards";
import type { Result } from "@/lib/result";


// Nombre de paiements NON annulés attachés à un frais (verrou modification/suppression).
async function feePaymentCount(svc: ReturnType<typeof serviceClient>, schoolId: string, feeId: string): Promise<number> {
  const { count } = await svc
    .from("fee_payments")
    .select("id", { count: "exact", head: true })
    .eq("school_id", schoolId).eq("fee_id", feeId).is("cancelled_at", null);
  return count ?? 0;
}

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

// ── Frais : création (avec tranches) ─────────────────────────────────
export type InstallmentInput = { name: string; amount: number; dueDate?: string | null };

export async function createFee(input: {
  kind: FeeKind;
  label: string;
  category?: string | null;
  className?: string | null;
  option?: string | null;
  schoolYear?: string | null;
  totalAmount: number;
  currency?: string;
  dueDate?: string | null;
  installments?: InstallmentInput[];
}): Promise<Result> {
  const label = input.label?.trim();
  if (!label) return { ok: false, message: "Libellé du frais requis." };
  if (input.kind === "scolaire" && !input.className) return { ok: false, message: "Choisissez une classe." };
  if (!isLiveMode()) return { ok: true };
  const c = await requireSchoolAdmin();
  if (!c) return { ok: false, message: "Réservé à la direction." };
  const svc = serviceClient();

  const { count } = await svc.from("fees").select("id", { count: "exact", head: true }).eq("school_id", c.schoolId).eq("kind", input.kind);
  const { data: fee, error } = await (svc.from("fees").insert as any)({
    school_id: c.schoolId, kind: input.kind, label,
    category: input.category?.trim() || null,
    class_name: input.className || null, option: input.option || null,
    school_year: input.schoolYear || null,
    total_amount: input.totalAmount || 0, currency: input.currency || "CDF",
    due_date: input.dueDate || null,
    position: count ?? 0,
  }).select("id").single();
  if (error || !fee) return { ok: false, message: "Création du frais impossible." };

  const insts = (input.installments ?? []).filter((i) => i.name?.trim() && i.amount > 0);
  if (insts.length) {
    const rows = insts.map((i, idx) => ({
      fee_id: (fee as any).id, school_id: c.schoolId, name: i.name.trim(),
      position: idx, amount: i.amount, due_date: i.dueDate || null,
    }));
    await (svc.from("fee_installments").insert as any)(rows);
  }
  revalidatePath("/school/finances");
  return { ok: true };
}

// ── Frais : modification (bloquée après le 1er paiement) ─────────────
export async function updateFee(input: {
  id: string;
  label: string;
  category?: string | null;
  className?: string | null;
  option?: string | null;
  totalAmount: number;
  currency?: string;
  dueDate?: string | null;
  installments?: InstallmentInput[];
}): Promise<Result> {
  // (category persistée ci-dessous)
  if (!input.id) return { ok: false, message: "Frais invalide." };
  if (!isLiveMode()) return { ok: true };
  const c = await requireSchoolAdmin();
  if (!c) return { ok: false, message: "Réservé à la direction." };
  const svc = serviceClient();

  // La modification reste autorisée même si des paiements existent (l'UI demande
  // confirmation). Seule la suppression est interdite dans ce cas (voir deleteFee).
  const { error } = await (svc.from("fees").update as any)({
    label: input.label?.trim() || "Frais",
    category: input.category === undefined ? undefined : (input.category?.trim() || null),
    class_name: input.className || null, option: input.option || null,
    total_amount: input.totalAmount || 0, currency: input.currency || "CDF",
    due_date: input.dueDate || null,
  }).eq("id", input.id).eq("school_id", c.schoolId);
  if (error) return { ok: false, message: "Mise à jour impossible." };

  // Remplace les tranches. Si des paiements référençaient une tranche supprimée,
  // leur lien est mis à NULL (fee_payments.installment_id ON DELETE SET NULL) ;
  // le montant et l'historique du paiement sont conservés.
  if (input.installments) {
    await svc.from("fee_installments").delete().eq("fee_id", input.id).eq("school_id", c.schoolId);
    const insts = input.installments.filter((i) => i.name?.trim() && i.amount > 0);
    if (insts.length) {
      await (svc.from("fee_installments").insert as any)(insts.map((i, idx) => ({
        fee_id: input.id, school_id: c.schoolId, name: i.name.trim(), position: idx, amount: i.amount, due_date: i.dueDate || null,
      })));
    }
  }
  revalidatePath("/school/finances");
  return { ok: true };
}

export async function deleteFee(id: string): Promise<Result> {
  if (!id) return { ok: false, message: "Frais invalide." };
  if (!isLiveMode()) return { ok: true };
  const c = await requireSchoolAdmin();
  if (!c) return { ok: false, message: "Réservé à la direction." };
  const svc = serviceClient();
  if (await feePaymentCount(svc, c.schoolId, id) > 0)
    return { ok: false, message: "Suppression impossible : des paiements existent. Archivez plutôt le frais." };
  const { error } = await svc.from("fees").delete().eq("id", id).eq("school_id", c.schoolId);
  if (error) return { ok: false, message: "Suppression impossible." };
  revalidatePath("/school/finances");
  return { ok: true };
}

export async function archiveFee(id: string, archived: boolean): Promise<Result> {
  if (!id) return { ok: false, message: "Frais invalide." };
  if (!isLiveMode()) return { ok: true };
  const c = await requireSchoolAdmin();
  if (!c) return { ok: false, message: "Réservé à la direction." };
  const svc = serviceClient();
  const { error } = await (svc.from("fees").update as any)({ archived }).eq("id", id).eq("school_id", c.schoolId);
  if (error) return { ok: false, message: "Opération impossible." };
  revalidatePath("/school/finances");
  return { ok: true };
}

// ── Montant ajusté / exonéré par élève ───────────────────────────────
export async function setFeeOverride(input: { feeId: string; studentId: string; amount: number; reason?: string }): Promise<Result> {
  if (!input.feeId || !input.studentId) return { ok: false, message: "Frais ou élève invalide." };
  if (input.amount < 0) return { ok: false, message: "Montant invalide." };
  if (!isLiveMode()) return { ok: true };
  const c = await requireSchoolAdmin();
  if (!c) return { ok: false, message: "Réservé à la direction." };
  const svc = serviceClient();
  const { error } = await (svc.from("fee_overrides").upsert as any)({
    school_id: c.schoolId, fee_id: input.feeId, student_id: input.studentId,
    amount: input.amount, reason: input.reason?.trim() || null,
  }, { onConflict: "fee_id,student_id" });
  if (error) return { ok: false, message: "Enregistrement impossible." };
  revalidatePath("/school/finances");
  return { ok: true };
}

export async function removeFeeOverride(feeId: string, studentId: string): Promise<Result> {
  if (!feeId || !studentId) return { ok: false, message: "Invalide." };
  if (!isLiveMode()) return { ok: true };
  const c = await requireSchoolAdmin();
  if (!c) return { ok: false, message: "Réservé à la direction." };
  const svc = serviceClient();
  const { error } = await svc.from("fee_overrides").delete().eq("fee_id", feeId).eq("student_id", studentId).eq("school_id", c.schoolId);
  if (error) return { ok: false, message: "Opération impossible." };
  revalidatePath("/school/finances");
  return { ok: true };
}

// ── Encaissement (source unique) → génère la facture ─────────────────
export async function recordFeePayment(input: {
  feeId: string;
  studentId: string;
  installmentId?: string | null;
  amount: number;
  currency?: string;
  paidAt?: string;
  invoiceNo?: string;
  cashierName?: string;
  note?: string;
}): Promise<Result> {
  if (!input.feeId || !input.studentId) return { ok: false, message: "Frais ou élève invalide." };
  if (!(input.amount > 0)) return { ok: false, message: "Montant invalide." };
  if (!isLiveMode()) return { ok: true };
  const c = await requireSchoolAdmin();
  if (!c) return { ok: false, message: "Réservé à la direction." };
  const svc = serviceClient();

  const { error } = await (svc.from("fee_payments").insert as any)({
    school_id: c.schoolId, fee_id: input.feeId, student_id: input.studentId,
    installment_id: input.installmentId || null,
    amount: input.amount, currency: input.currency || "CDF",
    paid_at: input.paidAt || new Date().toISOString(),
    invoice_no: input.invoiceNo?.trim() || null,
    cashier_name: input.cashierName?.trim() || null,
    note: input.note?.trim() || null,
    recorded_by: c.userId,
  });
  if (error) return { ok: false, message: "Enregistrement impossible." };
  revalidatePath("/school/finances");
  return { ok: true };
}

// ── Annulation d'un paiement (soft delete + motif) ───────────────────
export async function cancelFeePayment(id: string, reason: string): Promise<Result> {
  if (!id) return { ok: false, message: "Paiement invalide." };
  if (!reason?.trim()) return { ok: false, message: "Motif d'annulation requis." };
  if (!isLiveMode()) return { ok: true };
  const c = await requireSchoolAdmin();
  if (!c) return { ok: false, message: "Réservé à la direction." };
  const svc = serviceClient();
  const { error } = await (svc.from("fee_payments").update as any)({
    cancelled_at: new Date().toISOString(), cancel_reason: reason.trim(), cancelled_by: c.userId,
  }).eq("id", id).eq("school_id", c.schoolId).is("cancelled_at", null);
  if (error) return { ok: false, message: "Annulation impossible." };
  await (svc.from("finance_audit").insert as any)({
    school_id: c.schoolId, entity_type: "fee_payment", entity_id: id, action: "cancel", actor: c.userId, reason: reason.trim(),
  });
  revalidatePath("/school/finances");
  return { ok: true };
}

// ── Trésorerie : dépenses & recettes exceptionnelles ─────────────────
export async function addTreasuryEntry(input: {
  kind: TreasuryKind;
  amount: number;
  currency?: string;
  label: string;
  category?: string;
  entryDate?: string;
  schoolYear?: string;
  note?: string;
}): Promise<Result> {
  if (input.kind !== "depense" && input.kind !== "recette_exceptionnelle") return { ok: false, message: "Type invalide." };
  if (!(input.amount > 0)) return { ok: false, message: "Montant invalide." };
  if (!input.label?.trim()) return { ok: false, message: "Libellé requis." };
  if (!isLiveMode()) return { ok: true };
  const c = await requireSchoolAdmin();
  if (!c) return { ok: false, message: "Réservé à la direction." };
  const svc = serviceClient();
  const { error } = await (svc.from("treasury_entries").insert as any)({
    school_id: c.schoolId, kind: input.kind, amount: input.amount, currency: input.currency || "CDF",
    label: input.label.trim(), category: input.category?.trim() || null,
    entry_date: input.entryDate?.trim() || new Date().toISOString().slice(0, 10),
    school_year: input.schoolYear || null, note: input.note?.trim() || null, recorded_by: c.userId,
  });
  if (error) return { ok: false, message: "Enregistrement impossible." };
  revalidatePath("/school/finances");
  return { ok: true };
}

export async function updateTreasuryEntry(input: {
  id: string;
  amount: number;
  currency?: string;
  label: string;
  category?: string;
  entryDate?: string;
  note?: string;
}): Promise<Result> {
  if (!input.id) return { ok: false, message: "Écriture invalide." };
  if (!(input.amount > 0)) return { ok: false, message: "Montant invalide." };
  if (!input.label?.trim()) return { ok: false, message: "Libellé requis." };
  if (!isLiveMode()) return { ok: true };
  const c = await requireSchoolAdmin();
  if (!c) return { ok: false, message: "Réservé à la direction." };
  const svc = serviceClient();
  const { error } = await (svc.from("treasury_entries").update as any)({
    amount: input.amount, currency: input.currency || "CDF", label: input.label.trim(),
    category: input.category?.trim() || null, entry_date: input.entryDate?.trim() || undefined, note: input.note?.trim() || null,
  }).eq("id", input.id).eq("school_id", c.schoolId).is("cancelled_at", null);
  if (error) return { ok: false, message: "Mise à jour impossible." };
  await (svc.from("finance_audit").insert as any)({
    school_id: c.schoolId, entity_type: "treasury_entry", entity_id: input.id, action: "update", actor: c.userId,
  });
  revalidatePath("/school/finances");
  return { ok: true };
}

export async function cancelTreasuryEntry(id: string, reason: string): Promise<Result> {
  if (!id) return { ok: false, message: "Écriture invalide." };
  if (!reason?.trim()) return { ok: false, message: "Motif d'annulation requis." };
  if (!isLiveMode()) return { ok: true };
  const c = await requireSchoolAdmin();
  if (!c) return { ok: false, message: "Réservé à la direction." };
  const svc = serviceClient();
  const { error } = await (svc.from("treasury_entries").update as any)({
    cancelled_at: new Date().toISOString(), cancel_reason: reason.trim(), cancelled_by: c.userId,
  }).eq("id", id).eq("school_id", c.schoolId).is("cancelled_at", null);
  if (error) return { ok: false, message: "Annulation impossible." };
  await (svc.from("finance_audit").insert as any)({
    school_id: c.schoolId, entity_type: "treasury_entry", entity_id: id, action: "cancel", actor: c.userId, reason: reason.trim(),
  });
  revalidatePath("/school/finances");
  return { ok: true };
}

// ── Clôture quotidienne de caisse ────────────────────────────────────
export async function openCashSession(): Promise<Result> {
  if (!isLiveMode()) return { ok: true };
  const c = await requireSchoolAdmin();
  if (!c) return { ok: false, message: "Réservé à la direction." };
  const svc = serviceClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data: existing } = await svc.from("cash_sessions").select("id, status").eq("school_id", c.schoolId).eq("session_date", today).maybeSingle();
  if (existing) return { ok: false, message: (existing as any).status === "closed" ? "La caisse du jour est déjà clôturée." : "Une caisse est déjà ouverte." };
  const { error } = await (svc.from("cash_sessions").insert as any)({
    school_id: c.schoolId, session_date: today, opened_by: c.userId, status: "open",
  });
  if (error) return { ok: false, message: "Ouverture impossible." };
  revalidatePath("/school/finances");
  return { ok: true };
}

export async function closeCashSession(sessionId: string): Promise<Result> {
  if (!sessionId) return { ok: false, message: "Session invalide." };
  if (!isLiveMode()) return { ok: true };
  const c = await requireSchoolAdmin();
  if (!c) return { ok: false, message: "Réservé à la direction." };
  const svc = serviceClient();
  const { data: sess } = await svc.from("cash_sessions").select("id, session_date, status").eq("id", sessionId).eq("school_id", c.schoolId).maybeSingle();
  if (!sess) return { ok: false, message: "Session introuvable." };
  if ((sess as any).status === "closed") return { ok: false, message: "Caisse déjà clôturée." };
  const totals = await computeDayTotals(svc, c.schoolId, (sess as any).session_date);
  const { error } = await (svc.from("cash_sessions").update as any)({
    status: "closed", closed_by: c.userId, closed_at: new Date().toISOString(), totals,
  }).eq("id", sessionId).eq("school_id", c.schoolId);
  if (error) return { ok: false, message: "Clôture impossible." };
  await (svc.from("finance_audit").insert as any)({
    school_id: c.schoolId, entity_type: "cash_session", entity_id: sessionId, action: "close", actor: c.userId,
  });
  revalidatePath("/school/finances");
  return { ok: true };
}

export async function reopenCashSession(sessionId: string, reason: string): Promise<Result> {
  if (!sessionId) return { ok: false, message: "Session invalide." };
  if (!reason?.trim()) return { ok: false, message: "Motif requis." };
  if (!isLiveMode()) return { ok: true };
  const c = await requireSchoolAdmin();
  if (!c) return { ok: false, message: "Réservé à la direction." };
  const svc = serviceClient();
  const { error } = await (svc.from("cash_sessions").update as any)({
    status: "open", closed_by: null, closed_at: null,
  }).eq("id", sessionId).eq("school_id", c.schoolId).eq("status", "closed");
  if (error) return { ok: false, message: "Réouverture impossible." };
  await (svc.from("finance_audit").insert as any)({
    school_id: c.schoolId, entity_type: "cash_session", entity_id: sessionId, action: "reopen", actor: c.userId, reason: reason.trim(),
  });
  revalidatePath("/school/finances");
  return { ok: true };
}

// ── Facture : envoi au parent (best-effort via notifications) ────────
export async function sendInvoiceToParent(input: { studentId: string; feeLabel: string; amount: number; currency: string; invoiceNo?: string }): Promise<Result> {
  if (!input.studentId) return { ok: false, message: "Élève invalide." };
  if (!isLiveMode()) return { ok: true };
  const c = await requireSchoolAdmin();
  if (!c) return { ok: false, message: "Réservé à la direction." };
  const svc = serviceClient();
  try {
    const { data: links } = await svc.from("parent_links").select("parent_id").eq("student_id", input.studentId);
    const parentIds = [...new Set((links ?? []).map((l: any) => l.parent_id).filter(Boolean))];
    if (parentIds.length === 0) return { ok: false, message: "Aucun parent lié à cet élève." };
    const amountTxt = `${Math.round(input.amount).toLocaleString("fr-FR")} ${input.currency}`;
    const rows = parentIds.map((pid) => ({
      user_id: pid,
      kind: "school",
      body: `🧾 Paiement enregistré : ${input.feeLabel} — ${amountTxt}${input.invoiceNo ? ` (facture n° ${input.invoiceNo})` : ""}.`,
    }));
    const { error } = await (svc.from("notifications").insert as any)(rows);
    if (error) return { ok: false, message: "Envoi impossible (notifications indisponibles)." };
    return { ok: true };
  } catch {
    return { ok: false, message: "Envoi impossible." };
  }
}
