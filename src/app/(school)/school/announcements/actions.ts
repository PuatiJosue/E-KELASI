"use server";

import { revalidatePath } from "next/cache";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/db";
import { renderAnnouncementPdf } from "@/lib/announcement-pdf";

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

export async function createAnnouncement(input: {
  title: string;
  body: string;
  eventDate?: string;
}): Promise<Result> {
  const title = input.title?.trim();
  const body = input.body?.trim();
  if (!title || !body) return { ok: false, message: "Titre et message requis." };
  if (!isLiveMode()) return { ok: true };

  const c = await caller();
  if (!c) return { ok: false, message: "Action réservée à la direction." };

  const svc = service();
  const { data: inserted, error } = await svc.from("announcements").insert({
    school_id: c.schoolId,
    title,
    body,
    event_date: input.eventDate || null,
    created_by: c.userId,
  }).select("id, created_at").single();
  if (error || !inserted) return { ok: false, message: "Publication impossible." };

  // Génère un PDF de l'annonce (en-tête nom + logo de l'école) → URL signée.
  let pdfUrl: string | null = null;
  try {
    const { data: school } = await svc
      .from("schools")
      .select("name, city, logo_url, brand_color")
      .eq("id", c.schoolId)
      .maybeSingle();
    const issuedAt = new Date(inserted.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    const eventDate = input.eventDate
      ? new Date(input.eventDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
      : null;
    const pdf = await renderAnnouncementPdf({
      school: {
        name: (school as any)?.name ?? "École",
        city: (school as any)?.city ?? null,
        logoUrl: (school as any)?.logo_url ?? null,
        brandColor: (school as any)?.brand_color ?? null,
      },
      title,
      body,
      eventDate,
      issuedAt,
    });
    const path = `announcements/${inserted.id}.pdf`;
    const { error: upErr } = await svc.storage
      .from("grade-reports")
      .upload(path, pdf, { contentType: "application/pdf", upsert: true });
    if (!upErr) {
      const { data: signed } = await svc.storage.from("grade-reports").createSignedUrl(path, 60 * 60 * 24 * 365);
      pdfUrl = signed?.signedUrl ?? null;
    }
  } catch {
    // PDF best effort — la notification part quand même sans fichier
  }

  // Notifie les parents des élèves actifs de l'école (best effort), avec le PDF.
  try {
    const { data: students } = await svc
      .from("students")
      .select("id")
      .eq("school_id", c.schoolId)
      .eq("status", "active");
    const studentIds = (students ?? []).map((s: any) => s.id);
    if (studentIds.length > 0) {
      const { data: links } = await svc
        .from("parent_links")
        .select("parent_id")
        .in("student_id", studentIds);
      const parentIds = [...new Set((links ?? []).map((l: any) => l.parent_id))];
      if (parentIds.length > 0) {
        const rows = parentIds.map((pid) => ({
          user_id: pid as string,
          kind: "school" as const,
          body: `📢 ${title}`,
          payload: pdfUrl ? { file_url: pdfUrl, kind: "announcement_pdf" } : null,
        }));
        await svc.from("notifications").insert(rows);
      }
    }
  } catch {
    // notification best effort
  }

  revalidatePath("/school/announcements");
  return { ok: true };
}

export async function deleteAnnouncement(id: string): Promise<Result> {
  if (!id) return { ok: false, message: "Annonce invalide." };
  if (!isLiveMode()) return { ok: true };
  const c = await caller();
  if (!c) return { ok: false, message: "Action réservée à la direction." };
  const svc = service();
  const { error } = await svc.from("announcements").delete().eq("id", id).eq("school_id", c.schoolId);
  if (error) return { ok: false, message: "Suppression impossible." };
  revalidatePath("/school/announcements");
  return { ok: true };
}
