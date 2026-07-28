"use server";

import { revalidatePath } from "next/cache";
import { serviceClient } from "@/lib/supabase/service";
import { isLiveMode } from "@/lib/env";
import { requireSchoolAdmin } from "@/lib/auth/guards";
import type { Result } from "@/lib/result";


export async function addCourseVideo(input: {
  title: string;
  url: string;
  className?: string;
  subject?: string;
  description?: string;
  recipientIds?: string[];
}): Promise<Result> {
  const title = input.title?.trim();
  const url = input.url?.trim();
  if (!title || !url) return { ok: false, message: "Titre et lien (ou fichier) requis." };
  if (!/^https?:\/\//i.test(url)) return { ok: false, message: "Le lien doit commencer par http(s)://" };
  if (!isLiveMode()) return { ok: true };

  const c = await requireSchoolAdmin();
  if (!c) return { ok: false, message: "Réservé à la direction." };
  const svc = serviceClient();

  const { data: video, error } = await svc.from("course_videos").insert({
    school_id: c.schoolId,
    class_name: input.className?.trim() || null,
    subject: input.subject?.trim() || null,
    title,
    url,
    description: input.description?.trim() || null,
    created_by: c.userId,
  }).select("id").single();
  if (error || !video) return { ok: false, message: "Enregistrement impossible." };

  // Destinataires précis (optionnel) → restreint la visibilité + notifie.
  const recips = [...new Set((input.recipientIds ?? []).filter(Boolean))];
  if (recips.length > 0) {
    await svc.from("course_video_recipients").insert(recips.map((pid) => ({ video_id: video.id, parent_id: pid })));
    await svc.from("notifications").insert(
      recips.map((pid) => ({ user_id: pid, kind: "school" as const, body: `🎬 Nouvelle vidéo : ${title}` }))
    );
  }

  revalidatePath("/school/videos");
  return { ok: true };
}

export async function deleteCourseVideo(id: string): Promise<Result> {
  if (!id) return { ok: false, message: "Vidéo invalide." };
  if (!isLiveMode()) return { ok: true };
  const c = await requireSchoolAdmin();
  if (!c) return { ok: false, message: "Réservé à la direction." };
  const { error } = await serviceClient().from("course_videos").delete().eq("id", id).eq("school_id", c.schoolId);
  if (error) return { ok: false, message: "Suppression impossible." };
  revalidatePath("/school/videos");
  return { ok: true };
}
