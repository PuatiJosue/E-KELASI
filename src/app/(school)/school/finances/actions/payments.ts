"use server";

// Encaissement (source unique de vérité), annulation et envoi de la facture.

import { revalidatePath } from "next/cache";
import { serviceClient } from "@/lib/supabase/service";
import { isLiveMode } from "@/lib/env";
import { requireSchoolAdmin } from "@/lib/auth/guards";
import type { Result } from "@/lib/result";

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

