"use server";

import { revalidatePath } from "next/cache";
import { serviceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/env";
import { schoolPriceCents } from "@/lib/school-price";
import { SCHOOL_PAYMENT_METHODS, type SchoolPaymentMethod } from "@/lib/school-payment-methods";
import type { Result } from "@/lib/result";


function currentPeriod(): string {
  return new Date().toISOString().slice(0, 7);
}

// Vérifie que l'appelant est super_admin.
async function assertSuperAdmin(): Promise<{ ok: boolean; userId?: string }> {
  const session = createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return { ok: false };
  const { data: me } = await session.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return { ok: me?.role === "super_admin", userId: user.id };
}

function revalidateSchool(schoolId: string) {
  revalidatePath("/schools");
  revalidatePath(`/schools/${schoolId}`);
}

// Enregistre l'encaissement du mois hors Stripe (Mobile Money, virement,
// espèces) et réactive l'école. C'est le chemin de secours quand la carte n'est
// pas une option — il fait exactement ce que ferait le webhook Stripe.
export async function markSchoolPaid(
  schoolId: string,
  method: SchoolPaymentMethod = "manual",
  opts: { amountCents?: number; reference?: string; note?: string; period?: string } = {}
): Promise<Result> {
  if (!schoolId) return { ok: false, message: "École invalide." };
  if (!SCHOOL_PAYMENT_METHODS.some((m) => m.key === method)) {
    return { ok: false, message: "Méthode de paiement inconnue." };
  }
  if (!isLiveMode()) return { ok: true };
  const auth = await assertSuperAdmin();
  if (!auth.ok) return { ok: false, message: "Réservé au super admin." };

  // Montant : celui saisi s'il est plausible, sinon le tarif courant.
  const raw = Math.round(opts.amountCents ?? NaN);
  const amountCents = Number.isFinite(raw) && raw > 0 && raw <= 100_000_000 ? raw : schoolPriceCents();
  const period = /^\d{4}-\d{2}$/.test(opts.period ?? "") ? opts.period! : currentPeriod();

  const svc = serviceClient();
  const { error } = await (svc.from("school_payments").upsert as any)(
    {
      school_id: schoolId,
      period,
      amount_cents: amountCents,
      currency: "USD",
      method,
      reference: opts.reference?.trim().slice(0, 120) || null,
      note: opts.note?.trim().slice(0, 500) || null,
      recorded_by: auth.userId,
      paid_at: new Date().toISOString(),
    },
    { onConflict: "school_id,period" }
  );
  if (error) {
    console.warn("[mark-school-paid]", error.message);
    return { ok: false, message: "Enregistrement impossible." };
  }

  await svc.from("schools").update({ status: "active" }).eq("id", schoolId);
  revalidateSchool(schoolId);
  return { ok: true };
}

// Annule l'encaissement d'un mois (erreur de saisie). L'école n'est pas
// suspendue pour autant : c'est une décision séparée.
export async function unmarkSchoolPaid(schoolId: string, period: string): Promise<Result> {
  if (!schoolId || !/^\d{4}-\d{2}$/.test(period ?? "")) return { ok: false, message: "Période invalide." };
  if (!isLiveMode()) return { ok: true };
  const auth = await assertSuperAdmin();
  if (!auth.ok) return { ok: false, message: "Réservé au super admin." };

  const svc = serviceClient();
  const { error } = await svc
    .from("school_payments")
    .delete()
    .eq("school_id", schoolId)
    .eq("period", period);
  if (error) return { ok: false, message: "Suppression impossible." };

  revalidateSchool(schoolId);
  return { ok: true };
}

// Suspend ou réactive une école (accès direction + profs).
export async function setSchoolSuspended(schoolId: string, suspend: boolean): Promise<Result> {
  if (!schoolId) return { ok: false, message: "École invalide." };
  if (!isLiveMode()) return { ok: true };
  const auth = await assertSuperAdmin();
  if (!auth.ok) return { ok: false, message: "Réservé au super admin." };

  const svc = serviceClient();
  const { error } = await svc
    .from("schools")
    .update({ status: suspend ? "suspended" : "active" })
    .eq("id", schoolId);
  if (error) return { ok: false, message: "Mise à jour impossible." };

  revalidateSchool(schoolId);
  return { ok: true };
}
