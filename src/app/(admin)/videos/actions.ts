"use server";

import { revalidatePath } from "next/cache";
import { serviceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/env";
import type { Result } from "@/lib/result";


async function caller(): Promise<string | null> {
  const session = createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return null;
  const { data: prof } = await session.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return prof?.role === "super_admin" ? user.id : null;
}

export async function addPlatformVideo(input: {
  title: string;
  url: string;
  subject?: string;
  description?: string;
  recipientIds?: string[];
}): Promise<Result> {
  const title = input.title?.trim();
  const url = input.url?.trim();
  if (!title || !url) return { ok: false, message: "Titre et lien (ou fichier) requis." };
  if (!/^https?:\/\//i.test(url)) return { ok: false, message: "Le lien doit commencer par http(s)://" };
  if (!isLiveMode()) return { ok: true };

  const uid = await caller();
  if (!uid) return { ok: false, message: "Réservé à l'équipe E-KLASS." };
  const svc = serviceClient();

  const { data: video, error } = await svc.from("platform_videos").insert({
    title,
    url,
    subject: input.subject?.trim() || null,
    description: input.description?.trim() || null,
    created_by: uid,
  }).select("id").single();
  if (error || !video) return { ok: false, message: "Enregistrement impossible." };

  const recips = [...new Set((input.recipientIds ?? []).filter(Boolean))];
  if (recips.length > 0) {
    await svc.from("platform_video_recipients").insert(recips.map((pid) => ({ video_id: video.id, parent_id: pid })));
    await svc.from("notifications").insert(
      recips.map((pid) => ({ user_id: pid, kind: "school" as const, body: `🎬 Nouvelle vidéo : ${title}` }))
    );
  }

  revalidatePath("/videos");
  return { ok: true };
}

export async function deletePlatformVideo(id: string): Promise<Result> {
  if (!id) return { ok: false, message: "Vidéo invalide." };
  if (!isLiveMode()) return { ok: true };
  const uid = await caller();
  if (!uid) return { ok: false, message: "Réservé à l'équipe E-KLASS." };
  const { error } = await serviceClient().from("platform_videos").delete().eq("id", id);
  if (error) return { ok: false, message: "Suppression impossible." };
  revalidatePath("/videos");
  return { ok: true };
}
