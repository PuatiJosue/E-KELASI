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

// Mois courant au format 'YYYY-MM'.
function currentPeriod(): string {
  return new Date().toISOString().slice(0, 7);
}

// Vérifie que l'appelant est direction et renvoie son school_id (ou null).
async function callerSchoolId(): Promise<string | null> {
  const session = createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return null;
  const { data: staff } = await session
    .from("school_staff")
    .select("school_id")
    .eq("user_id", user.id)
    .eq("role", "school_admin")
    .maybeSingle();
  return staff?.school_id ?? null;
}

// Liste les parents ayant payé la cotisation du mois courant (pour SON école).
export async function getParentFeeStatus(): Promise<string[]> {
  if (!isLiveMode()) return [];
  const schoolId = await callerSchoolId();
  if (!schoolId) return [];
  const svc = service();
  const { data } = await svc
    .from("parent_fee_payments")
    .select("parent_id")
    .eq("school_id", schoolId)
    .eq("period", currentPeriod());
  return [...new Set((data ?? []).map((r: any) => r.parent_id))];
}

// Enregistre la cotisation du mois pour un parent + réactive son accès.
export async function markParentPaid(parentId: string): Promise<Result> {
  if (!parentId) return { ok: false, message: "Parent invalide." };
  if (!isLiveMode()) return { ok: true };

  const session = createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return { ok: false, message: "Non authentifié." };
  const schoolId = await callerSchoolId();
  if (!schoolId) return { ok: false, message: "Action réservée à la direction." };

  const svc = service();
  const { error } = await svc.from("parent_fee_payments").upsert(
    {
      school_id: schoolId,
      parent_id: parentId,
      period: currentPeriod(),
      amount_cents: 500,
      currency: "USD",
      method: "cash",
      recorded_by: user.id,
    },
    { onConflict: "school_id,parent_id,period" }
  );
  if (error) return { ok: false, message: "Enregistrement impossible." };

  // Paiement reçu → on réactive l'accès du parent (liens vers les élèves de l'école).
  const { data: students } = await svc.from("students").select("id").eq("school_id", schoolId);
  const ids = (students ?? []).map((s: any) => s.id);
  if (ids.length > 0) {
    await svc.from("parent_links").update({ access_status: "active" }).eq("parent_id", parentId).in("student_id", ids);
  }

  revalidatePath("/school/parents");
  return { ok: true };
}

// Bloque ou débloque l'accès d'un parent — réservé à la direction de SON école.
export async function setParentAccess(parentId: string, block: boolean): Promise<Result> {
  if (!parentId) return { ok: false, message: "Parent invalide." };
  if (!isLiveMode()) return { ok: true };

  const session = createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return { ok: false, message: "Non authentifié." };

  const { data: staff } = await session
    .from("school_staff")
    .select("school_id")
    .eq("user_id", user.id)
    .eq("role", "school_admin")
    .maybeSingle();
  if (!staff) return { ok: false, message: "Action réservée à la direction." };

  const svc = service();
  // Élèves de l'école → on ne touche QUE les liens vers ces élèves.
  const { data: students } = await svc.from("students").select("id").eq("school_id", staff.school_id);
  const ids = (students ?? []).map((s: any) => s.id);
  if (ids.length === 0) return { ok: false, message: "Aucun élève dans l'école." };

  const { error } = await svc
    .from("parent_links")
    .update({ access_status: block ? "blocked" : "active" })
    .eq("parent_id", parentId)
    .in("student_id", ids);
  if (error) return { ok: false, message: "Échec de la mise à jour." };

  revalidatePath("/school/parents");
  return { ok: true };
}
