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

export async function addCourseVideo(input: {
  title: string;
  url: string;
  className?: string;
  subject?: string;
  description?: string;
}): Promise<Result> {
  const title = input.title?.trim();
  const url = input.url?.trim();
  if (!title || !url) return { ok: false, message: "Titre et lien requis." };
  if (!/^https?:\/\//i.test(url)) return { ok: false, message: "Le lien doit commencer par http(s)://" };
  if (!isLiveMode()) return { ok: true };

  const c = await caller();
  if (!c) return { ok: false, message: "Réservé à la direction." };

  const { error } = await service().from("course_videos").insert({
    school_id: c.schoolId,
    class_name: input.className?.trim() || null,
    subject: input.subject?.trim() || null,
    title,
    url,
    description: input.description?.trim() || null,
    created_by: c.userId,
  });
  if (error) return { ok: false, message: "Enregistrement impossible." };
  revalidatePath("/school/videos");
  return { ok: true };
}

export async function deleteCourseVideo(id: string): Promise<Result> {
  if (!id) return { ok: false, message: "Vidéo invalide." };
  if (!isLiveMode()) return { ok: true };
  const c = await caller();
  if (!c) return { ok: false, message: "Réservé à la direction." };
  const { error } = await service().from("course_videos").delete().eq("id", id).eq("school_id", c.schoolId);
  if (error) return { ok: false, message: "Suppression impossible." };
  revalidatePath("/school/videos");
  return { ok: true };
}
