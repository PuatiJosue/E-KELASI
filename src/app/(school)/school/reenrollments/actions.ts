"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { serviceClient } from "@/lib/supabase/service";
import { isLiveMode } from "@/lib/env";
import { requireSchoolAdmin } from "@/lib/auth/guards";
import type { Result } from "@/lib/result";


export async function setSchoolYearAction(year: string): Promise<Result> {
  if (!isLiveMode()) return { ok: true };
  const c = await requireSchoolAdmin();
  if (!c) return { ok: false, message: "Réservé à la direction." };
  const svc = serviceClient();
  const { error } = await svc.from("schools").update({ current_year: year.trim() || null }).eq("id", c.schoolId);
  if (error) return { ok: false, message: "Enregistrement impossible." };
  revalidatePath("/school/reenrollments");
  return { ok: true };
}

export async function validateReenrollment(id: string, extra: { label: string; value: string }[]): Promise<Result> {
  if (!id) return { ok: false, message: "Demande invalide." };
  if (!isLiveMode()) return { ok: true };
  const c = await requireSchoolAdmin();
  if (!c) return { ok: false, message: "Réservé à la direction." };
  const svc = serviceClient();

  const { data: rr } = await svc
    .from("reenrollments")
    .select("id, student_id, requested_class, option, student_data, parent_data, status")
    .eq("id", id)
    .eq("school_id", c.schoolId)
    .maybeSingle();
  if (!rr) return { ok: false, message: "Demande introuvable." };
  if ((rr as any).status !== "pending") return { ok: false, message: "Demande déjà traitée." };

  const sd = ((rr as any).student_data ?? {}) as any;
  const pd = ((rr as any).parent_data ?? {}) as any;

  // Applique les infos de l'élève.
  const studentUpd: Record<string, any> = {
    class_name: (rr as any).requested_class ?? undefined,
    option: (rr as any).option ?? null,
  };
  if (sd.firstName) studentUpd.first_name = sd.firstName;
  if (sd.middleName !== undefined) studentUpd.middle_name = sd.middleName || null;
  if (sd.lastName) studentUpd.last_name = sd.lastName;
  if (sd.sex === "M" || sd.sex === "F") studentUpd.sex = sd.sex;
  if (sd.birthDate) studentUpd.birth_date = sd.birthDate;
  if (sd.firstName || sd.lastName || sd.middleName !== undefined) {
    studentUpd.full_name = [sd.lastName, sd.middleName, sd.firstName].filter(Boolean).join(" ");
  }
  if ((rr as any).requested_class) studentUpd.grade_level = (rr as any).requested_class;
  await svc.from("students").update(studentUpd).eq("id", (rr as any).student_id).eq("school_id", c.schoolId);

  // Applique les infos du parent (nom + téléphone).
  const { data: link } = await svc
    .from("parent_links")
    .select("parent_id")
    .eq("student_id", (rr as any).student_id)
    .limit(1)
    .maybeSingle();
  if (link?.parent_id && (pd.fullName || pd.phone)) {
    const pUpd: Record<string, any> = {};
    if (pd.fullName) pUpd.full_name = pd.fullName;
    if (pd.phone) pUpd.phone = pd.phone;
    if (Object.keys(pUpd).length > 0) await svc.from("profiles").update(pUpd).eq("id", link.parent_id);
  }

  // Récupère la signature de l'école.
  const { data: school } = await svc.from("schools").select("director_name, signature_url").eq("id", c.schoolId).maybeSingle();
  const code = randomBytes(5).toString("hex").toUpperCase();
  const cleanExtra = (extra ?? []).filter((e) => e.label?.trim()).map((e) => ({ label: e.label.trim(), value: e.value?.trim() ?? "" }));

  const { error } = await svc
    .from("reenrollments")
    .update({
      status: "validated",
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
  if (link?.parent_id) {
    const { data: stu } = await svc.from("students").select("full_name").eq("id", (rr as any).student_id).maybeSingle();
    const name = (stu as any)?.full_name ?? "";
    await svc.from("notifications").insert({
      user_id: link.parent_id,
      kind: "school",
      body: `✅ Réinscription acceptée${name ? ` : ${name}` : ""}${(rr as any).requested_class ? ` (${(rr as any).requested_class})` : ""}`,
    });
  }

  revalidatePath("/school/reenrollments");
  return { ok: true };
}

export async function rejectReenrollment(id: string, comment: string): Promise<Result> {
  if (!id) return { ok: false, message: "Demande invalide." };
  if (!comment?.trim()) return { ok: false, message: "Indiquez un motif de rejet." };
  if (!isLiveMode()) return { ok: true };
  const c = await requireSchoolAdmin();
  if (!c) return { ok: false, message: "Réservé à la direction." };
  const svc = serviceClient();
  const { data: rr } = await svc
    .from("reenrollments")
    .select("student_id")
    .eq("id", id)
    .eq("school_id", c.schoolId)
    .maybeSingle();
  const { error } = await svc
    .from("reenrollments")
    .update({ status: "rejected", comment: comment.trim(), validated_by: c.userId, decided_at: new Date().toISOString() })
    .eq("id", id)
    .eq("school_id", c.schoolId)
    .eq("status", "pending");
  if (error) return { ok: false, message: "Rejet impossible." };

  if ((rr as any)?.student_id) {
    const { data: link } = await svc
      .from("parent_links")
      .select("parent_id")
      .eq("student_id", (rr as any).student_id)
      .limit(1)
      .maybeSingle();
    if (link?.parent_id) {
      const { data: stu } = await svc.from("students").select("full_name").eq("id", (rr as any).student_id).maybeSingle();
      const name = (stu as any)?.full_name ?? "";
      await svc.from("notifications").insert({
        user_id: link.parent_id,
        kind: "school",
        body: `❌ Réinscription refusée${name ? ` (${name})` : ""} : ${comment.trim()}`,
      });
    }
  }

  revalidatePath("/school/reenrollments");
  return { ok: true };
}
