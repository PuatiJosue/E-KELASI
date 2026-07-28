"use server";

// Trésorerie : dépenses et recettes exceptionnelles.

import { revalidatePath } from "next/cache";
import { serviceClient } from "@/lib/supabase/service";
import { isLiveMode } from "@/lib/env";
import { requireSchoolAdmin } from "@/lib/auth/guards";
import type { TreasuryKind } from "@/lib/finance/treasury";
import type { Result } from "@/lib/result";

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

