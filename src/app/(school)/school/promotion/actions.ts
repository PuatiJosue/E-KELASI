"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/db";

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

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function caller(): Promise<{ userId: string; schoolId: string } | null> {
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
  return { userId: user.id, schoolId: staff.school_id };
}

export async function applyPromotion(input: {
  schoolYear: string;
  decisions: PromotionDecision[];
}): Promise<Result> {
  const schoolYear = (input.schoolYear ?? "").trim();
  if (!schoolYear) return { ok: false, message: "Indiquez l'année scolaire cible." };
  const decisions = (input.decisions ?? []).filter((d) => d.action !== "skip");
  if (decisions.length === 0) return { ok: false, message: "Aucun élève à traiter." };
  if (!isLiveMode()) return { ok: true, promoted: 0, repeated: 0, graduated: 0 };

  const c = await caller();
  if (!c) return { ok: false, message: "Réservé à la direction." };

  const svc = service();
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
