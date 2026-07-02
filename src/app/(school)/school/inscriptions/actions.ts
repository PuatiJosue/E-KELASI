"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
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

export async function validateInscription(id: string, extra: { label: string; value: string }[]): Promise<Result> {
  if (!id) return { ok: false, message: "Demande invalide." };
  if (!isLiveMode()) return { ok: true };
  const c = await caller();
  if (!c) return { ok: false, message: "Réservé à la direction." };
  const svc = service();

  const { data: ins } = await svc
    .from("inscriptions")
    .select("id, status, student_data, requested_class, option, photo_student_url, created_by")
    .eq("id", id)
    .eq("school_id", c.schoolId)
    .maybeSingle();
  if (!ins) return { ok: false, message: "Demande introuvable." };
  if ((ins as any).status !== "pending") return { ok: false, message: "Demande déjà traitée." };

  const sd = ((ins as any).student_data ?? {}) as any;
  const fullName = [sd.lastName, sd.middleName, sd.firstName].filter(Boolean).join(" ");
  const cls = (ins as any).requested_class ?? null;

  // Crée l'élève actif.
  const { data: student, error: stErr } = await svc
    .from("students")
    .insert({
      school_id: c.schoolId,
      full_name: fullName,
      first_name: sd.firstName ?? null,
      middle_name: sd.middleName ?? null,
      last_name: sd.lastName ?? null,
      sex: sd.sex === "M" || sd.sex === "F" ? sd.sex : null,
      birth_date: sd.birthDate || null,
      class_name: cls,
      grade_level: cls ?? "—",
      option: (ins as any).option ?? null,
      avatar_url: (ins as any).photo_student_url ?? null,
      status: "active",
      created_by: (ins as any).created_by ?? null,
    })
    .select("id")
    .single();
  if (stErr || !student) return { ok: false, message: "Création de l'élève impossible." };

  // Lie le parent (créateur de la demande).
  if ((ins as any).created_by) {
    await svc.from("parent_links").insert({
      parent_id: (ins as any).created_by,
      student_id: student.id,
      relation: "parent",
      is_primary: true,
      access_status: "active",
    });
  }

  const { data: school } = await svc.from("schools").select("director_name, signature_url").eq("id", c.schoolId).maybeSingle();
  const code = randomBytes(5).toString("hex").toUpperCase();
  const cleanExtra = (extra ?? []).filter((e) => e.label?.trim()).map((e) => ({ label: e.label.trim(), value: e.value?.trim() ?? "" }));

  const { error } = await svc
    .from("inscriptions")
    .update({
      status: "validated",
      student_id: student.id,
      verify_code: code,
      signed_by: (school as any)?.director_name ?? null,
      signature_url: (school as any)?.signature_url ?? null,
      extra: cleanExtra,
      validated_by: c.userId,
      decided_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("school_id", c.schoolId);
  if (error) return { ok: false, message: "Validation impossible." };

  // Notifie le parent (→ push via send-push).
  if ((ins as any).created_by) {
    await svc.from("notifications").insert({
      user_id: (ins as any).created_by,
      kind: "school",
      body: `✅ Inscription acceptée : ${fullName}${cls ? ` (${cls})` : ""}`,
    });
  }

  revalidatePath("/school/inscriptions");
  revalidatePath("/school/students");
  return { ok: true };
}

export async function rejectInscription(id: string, comment: string): Promise<Result> {
  if (!id) return { ok: false, message: "Demande invalide." };
  if (!comment?.trim()) return { ok: false, message: "Indiquez un motif." };
  if (!isLiveMode()) return { ok: true };
  const c = await caller();
  if (!c) return { ok: false, message: "Réservé à la direction." };
  const svc = service();
  const { data: ins } = await svc
    .from("inscriptions")
    .select("created_by, student_data")
    .eq("id", id)
    .eq("school_id", c.schoolId)
    .maybeSingle();
  const { error } = await svc
    .from("inscriptions")
    .update({ status: "rejected", comment: comment.trim(), validated_by: c.userId, decided_at: new Date().toISOString() })
    .eq("id", id)
    .eq("school_id", c.schoolId)
    .eq("status", "pending");
  if (error) return { ok: false, message: "Rejet impossible." };

  if ((ins as any)?.created_by) {
    const sd = ((ins as any).student_data ?? {}) as any;
    const name = [sd.lastName, sd.firstName].filter(Boolean).join(" ");
    await svc.from("notifications").insert({
      user_id: (ins as any).created_by,
      kind: "school",
      body: `❌ Inscription refusée${name ? ` (${name})` : ""} : ${comment.trim()}`,
    });
  }

  revalidatePath("/school/inscriptions");
  return { ok: true };
}
