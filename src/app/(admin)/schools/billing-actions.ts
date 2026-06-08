"use server";

import { revalidatePath } from "next/cache";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/db";

type Result = { ok: true } | { ok: false; message: string };

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

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

// Marque l'abonnement 90$ de l'école comme payé pour le mois + active l'école.
export async function markSchoolPaid(schoolId: string, method: "manual" | "mobile_money" = "manual"): Promise<Result> {
  if (!schoolId) return { ok: false, message: "École invalide." };
  if (!isLiveMode()) return { ok: true };
  const auth = await assertSuperAdmin();
  if (!auth.ok) return { ok: false, message: "Réservé au super admin." };

  const svc = service();
  const { error } = await svc.from("school_payments").upsert(
    {
      school_id: schoolId,
      period: currentPeriod(),
      amount_cents: 9000,
      currency: "USD",
      method,
      recorded_by: auth.userId,
    },
    { onConflict: "school_id,period" }
  );
  if (error) return { ok: false, message: "Enregistrement impossible." };

  await svc.from("schools").update({ status: "active" }).eq("id", schoolId);
  revalidatePath("/schools");
  return { ok: true };
}

// Suspend ou réactive une école (accès direction + profs).
export async function setSchoolSuspended(schoolId: string, suspend: boolean): Promise<Result> {
  if (!schoolId) return { ok: false, message: "École invalide." };
  if (!isLiveMode()) return { ok: true };
  const auth = await assertSuperAdmin();
  if (!auth.ok) return { ok: false, message: "Réservé au super admin." };

  const svc = service();
  const { error } = await svc
    .from("schools")
    .update({ status: suspend ? "suspended" : "active" })
    .eq("id", schoolId);
  if (error) return { ok: false, message: "Mise à jour impossible." };

  revalidatePath("/schools");
  return { ok: true };
}
