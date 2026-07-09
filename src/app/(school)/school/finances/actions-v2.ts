"use server";

import { revalidatePath } from "next/cache";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/db";
import { getFeeDetail, type FeeDetail, type FeeKind } from "@/lib/finance/fees";
import { listFeePayments, type FeePayment } from "@/lib/finance/payments";
import type { TreasuryKind } from "@/lib/finance/treasury";

type Result = { ok: true } | { ok: false; message: string };

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function caller(): Promise<{ schoolId: string; userId: string } | null> {
  const session = createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return null;
  const { data: staff } = await session
    .from("school_staff")
    .select("school_id")
    .eq("user_id", user.id)
    .eq("role", "school_admin")
    .maybeSingle();
  if (!staff?.school_id) return null;
  return { schoolId: staff.school_id, userId: user.id };
}

// Nombre de paiements NON annulés attachés à un frais (verrou modification/suppression).
async function feePaymentCount(svc: ReturnType<typeof service>, schoolId: string, feeId: string): Promise<number> {
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
  installments?: InstallmentInput[];
}): Promise<Result> {
  const label = input.label?.trim();
  if (!label) return { ok: false, message: "Libellé du frais requis." };
  if (input.kind === "scolaire" && !input.className) return { ok: false, message: "Choisissez une classe." };
  if (!isLiveMode()) return { ok: true };
  const c = await caller();
  if (!c) return { ok: false, message: "Réservé à la direction." };
  const svc = service();

  const { count } = await svc.from("fees").select("id", { count: "exact", head: true }).eq("school_id", c.schoolId).eq("kind", input.kind);
  const { data: fee, error } = await (svc.from("fees").insert as any)({
    school_id: c.schoolId, kind: input.kind, label,
    category: input.category?.trim() || null,
    class_name: input.className || null, option: input.option || null,
    school_year: input.schoolYear || null,
    total_amount: input.totalAmount || 0, currency: input.currency || "CDF",
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
  installments?: InstallmentInput[];
}): Promise<Result> {
  // (category persistée ci-dessous)
  if (!input.id) return { ok: false, message: "Frais invalide." };
  if (!isLiveMode()) return { ok: true };
  const c = await caller();
  if (!c) return { ok: false, message: "Réservé à la direction." };
  const svc = service();

  if (await feePaymentCount(svc, c.schoolId, input.id) > 0)
    return { ok: false, message: "Modification impossible : des paiements ont déjà été enregistrés." };

  const { error } = await (svc.from("fees").update as any)({
    label: input.label?.trim() || "Frais",
    category: input.category === undefined ? undefined : (input.category?.trim() || null),
    class_name: input.className || null, option: input.option || null,
    total_amount: input.totalAmount || 0, currency: input.currency || "CDF",
  }).eq("id", input.id).eq("school_id", c.schoolId);
  if (error) return { ok: false, message: "Mise à jour impossible." };

  // Remplace les tranches (aucun paiement → pas de référence à préserver).
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
  const c = await caller();
  if (!c) return { ok: false, message: "Réservé à la direction." };
  const svc = service();
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
  const c = await caller();
  if (!c) return { ok: false, message: "Réservé à la direction." };
  const svc = service();
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
  const c = await caller();
  if (!c) return { ok: false, message: "Réservé à la direction." };
  const svc = service();
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
  const c = await caller();
  if (!c) return { ok: false, message: "Réservé à la direction." };
  const svc = service();
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
  const c = await caller();
  if (!c) return { ok: false, message: "Réservé à la direction." };
  const svc = service();

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
  const c = await caller();
  if (!c) return { ok: false, message: "Réservé à la direction." };
  const svc = service();
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
  const c = await caller();
  if (!c) return { ok: false, message: "Réservé à la direction." };
  const svc = service();
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
  const c = await caller();
  if (!c) return { ok: false, message: "Réservé à la direction." };
  const svc = service();
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
  const c = await caller();
  if (!c) return { ok: false, message: "Réservé à la direction." };
  const svc = service();
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
