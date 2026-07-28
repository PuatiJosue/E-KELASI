"use server";

// Clôture quotidienne de caisse : ouverture, clôture, réouverture.

import { revalidatePath } from "next/cache";
import { serviceClient } from "@/lib/supabase/service";
import { isLiveMode } from "@/lib/env";
import { requireSchoolAdmin } from "@/lib/auth/guards";
import { computeDayTotals } from "@/lib/finance/cash-session";
import type { Result } from "@/lib/result";

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

