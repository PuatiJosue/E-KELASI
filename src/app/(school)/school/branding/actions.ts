"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/db";

type Result = { ok: true } | { ok: false; message: string };

export async function updateBrandingAction(args: {
  name: string;
  brandColor: string;
  logoUrl: string | null;
}): Promise<Result> {
  if (!isLiveMode()) return { ok: true };
  if (!args.name.trim()) return { ok: false, message: "Le nom est requis." };
  if (!/^#[0-9a-f]{6}$/i.test(args.brandColor)) return { ok: false, message: "Couleur invalide (format #rrggbb)." };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Non authentifié" };

  const { data: staff } = await supabase
    .from("school_staff")
    .select("school_id")
    .eq("user_id", user.id)
    .eq("role", "school_admin")
    .maybeSingle();
  if (!staff) return { ok: false, message: "Vous n'êtes pas direction." };

  const { error } = await supabase
    .from("schools")
    .update({
      name: args.name.trim(),
      brand_color: args.brandColor,
      logo_url: args.logoUrl,
    })
    .eq("id", staff.school_id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/school", "layout");
  return { ok: true };
}
