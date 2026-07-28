"use server";

// Frais : création (avec tranches), modification, archivage, suppression et
// montants ajustés par élève.

import { revalidatePath } from "next/cache";
import { serviceClient } from "@/lib/supabase/service";
import { isLiveMode } from "@/lib/env";
import { requireSchoolAdmin } from "@/lib/auth/guards";
import { feePaymentCount } from "./guards";
import type { FeeKind } from "@/lib/finance/fees";
import type { Result } from "@/lib/result";

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

