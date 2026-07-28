"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { serviceClient } from "@/lib/supabase/service";
import { isLiveMode } from "@/lib/env";
import { requireSchoolAdmin } from "@/lib/auth/guards";

export type PromotionAction = "promote" | "redouble" | "graduate" | "skip";

export type PromotionDecision = {
  studentId: string;
  currentClass: string;
  currentOption: string | null;
  action: PromotionAction;
  targetClass?: string;   // pour « promote » (classe supérieure ou manuelle)
  option?: string | null; // option à appliquer (ex. entrée en humanités)
};

type Result =
  | { ok: true; promoted: number; repeated: number; graduated: number }
  | { ok: false; message: string };

export async function applyPromotion(input: {
  schoolYear: string;
  decisions: PromotionDecision[];
}): Promise<Result> {
  const schoolYear = (input.schoolYear ?? "").trim();
  if (!schoolYear) return { ok: false, message: "Indiquez l'année scolaire cible." };
  const decisions = (input.decisions ?? []).filter((d) => d.action !== "skip");
  if (decisions.length === 0) return { ok: false, message: "Aucun élève à traiter." };
  if (!isLiveMode()) return { ok: true, promoted: 0, repeated: 0, graduated: 0 };

  const c = await requireSchoolAdmin();
  if (!c) return { ok: false, message: "Réservé à la direction." };

  const svc = serviceClient();
  const { data: school } = await svc
    .from("schools")
    .select("director_name, signature_url")
    .eq("id", c.schoolId)
    .maybeSingle();
  const signedBy = (school as any)?.director_name ?? null;
  const signatureUrl = (school as any)?.signature_url ?? null;
  const now = new Date().toISOString();

  let promoted = 0, repeated = 0, graduated = 0;
  const certRows: any[] = [];

  for (const d of decisions) {
    if (!d.studentId) continue;

    if (d.action === "promote") {
      const target = (d.targetClass ?? "").trim();
      if (!target) continue;
      const option = d.option !== undefined ? d.option : d.currentOption;
      await svc
        .from("students")
        .update({
          class_name: target,
          grade_level: target,
          option: option || null,
          previous_class: d.currentClass || null,
          previous_option: d.currentOption || null,
          promoted_at: now,
        })
        .eq("id", d.studentId)
        .eq("school_id", c.schoolId);
      certRows.push(cert(c, schoolYear, d.studentId, "promotion", target, option ?? null, signedBy, signatureUrl, now));
      promoted += 1;
    } else if (d.action === "redouble") {
      certRows.push(cert(c, schoolYear, d.studentId, "redoublant", d.currentClass, d.currentOption, signedBy, signatureUrl, now));
      repeated += 1;
    } else if (d.action === "graduate") {
      await svc
        .from("students")
        .update({ status: "graduated", previous_class: d.currentClass || null, previous_option: d.currentOption || null, promoted_at: now })
        .eq("id", d.studentId)
        .eq("school_id", c.schoolId);
      graduated += 1;
    }
  }

  if (certRows.length > 0) {
    const { error } = await svc.from("reenrollments").insert(certRows);
    if (error) return { ok: false, message: "Certificats : enregistrement partiel impossible." };
  }

  revalidatePath("/school/promotion");
  revalidatePath("/school/students");
  revalidatePath("/school/reenrollments");
  return { ok: true, promoted, repeated, graduated };
}

/** Résumé du dernier passage appliqué (pour proposer une annulation). */
export async function getLastPromotionInfo(): Promise<{ at: string; students: number; dateLabel: string } | null> {
  if (!isLiveMode()) return null;
  const c = await requireSchoolAdmin();
  if (!c) return null;
  const svc = serviceClient();
  const { data: last } = await svc
    .from("students")
    .select("promoted_at")
    .eq("school_id", c.schoolId)
    .not("promoted_at", "is", null)
    .order("promoted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const at = (last as any)?.promoted_at as string | undefined;
  if (!at) return null;
  const { count } = await svc
    .from("students")
    .select("id", { count: "exact", head: true })
    .eq("school_id", c.schoolId)
    .eq("promoted_at", at);
  return {
    at,
    students: count ?? 0,
    dateLabel: new Date(at).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
  };
}

/** Annule le dernier passage : restaure les classes/statuts et supprime ses certificats. */
export async function undoLastPromotion(): Promise<{ ok: true; reverted: number } | { ok: false; message: string }> {
  if (!isLiveMode()) return { ok: true, reverted: 0 };
  const c = await requireSchoolAdmin();
  if (!c) return { ok: false, message: "Réservé à la direction." };
  const svc = serviceClient();

  const { data: last } = await svc
    .from("students")
    .select("promoted_at")
    .eq("school_id", c.schoolId)
    .not("promoted_at", "is", null)
    .order("promoted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const at = (last as any)?.promoted_at as string | undefined;
  if (!at) return { ok: false, message: "Aucun passage récent à annuler." };

  const { data: batch } = await svc
    .from("students")
    .select("id, previous_class, previous_option")
    .eq("school_id", c.schoolId)
    .eq("promoted_at", at);

  let reverted = 0;
  for (const s of (batch ?? []) as any[]) {
    const restore: Record<string, any> = {
      status: "active",
      previous_class: null,
      previous_option: null,
      promoted_at: null,
    };
    if (s.previous_class) {
      restore.class_name = s.previous_class;
      restore.grade_level = s.previous_class;
      restore.option = s.previous_option || null;
    }
    await svc.from("students").update(restore).eq("id", s.id).eq("school_id", c.schoolId);
    reverted += 1;
  }

  // Supprime les certificats de réinscription générés par ce lot.
  await svc.from("reenrollments").delete().eq("school_id", c.schoolId).eq("decided_at", at).eq("status", "validated");

  revalidatePath("/school/promotion");
  revalidatePath("/school/students");
  revalidatePath("/school/reenrollments");
  return { ok: true, reverted };
}

function cert(
  c: { userId: string; schoolId: string },
  schoolYear: string,
  studentId: string,
  mode: "promotion" | "redoublant",
  requestedClass: string,
  option: string | null,
  signedBy: string | null,
  signatureUrl: string | null,
  now: string,
) {
  return {
    school_id: c.schoolId,
    student_id: studentId,
    school_year: schoolYear,
    mode,
    requested_class: requestedClass,
    option: option || null,
    status: "validated",
    verify_code: randomBytes(5).toString("hex").toUpperCase(),
    signed_by: signedBy,
    signature_url: signatureUrl,
    validated_by: c.userId,
    created_by: c.userId,
    decided_at: now,
  };
}
