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
}): Promise<Result> {
  const title = input.title?.trim();
  const url = input.url?.trim();
  if (!title || !url) return { ok: false, message: "Titre et lien requis." };
  if (!/^https?:\/\//i.test(url)) return { ok: false, message: "Le lien doit commencer par http(s)://" };
  if (!isLiveMode()) return { ok: true };

  const uid = await caller();
  if (!uid) return { ok: false, message: "Réservé à l'équipe E-KLASS." };

  const { error } = await service().from("platform_videos").insert({
    title,
    url,
    subject: input.subject?.trim() || null,
    description: input.description?.trim() || null,
    created_by: uid,
  });
  if (error) return { ok: false, message: "Enregistrement impossible." };
  revalidatePath("/videos");
  return { ok: true };
}

export async function deletePlatformVideo(id: string): Promise<Result> {
  if (!id) return { ok: false, message: "Vidéo invalide." };
  if (!isLiveMode()) return { ok: true };
  const uid = await caller();
  if (!uid) return { ok: false, message: "Réservé à l'équipe E-KLASS." };
  const { error } = await service().from("platform_videos").delete().eq("id", id);
  if (error) return { ok: false, message: "Suppression impossible." };
  revalidatePath("/videos");
  return { ok: true };
}
