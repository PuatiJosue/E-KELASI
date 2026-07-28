"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/env";
import type { Result } from "@/lib/result";


export async function updateBrandingAction(args: {
  name: string;
  brandColor: string;
  logoUrl: string | null;
  email?: string;
  phone?: string;
  address?: string;
  commune?: string;
  quartier?: string;
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

  const update: Record<string, any> = {
    name: args.name.trim(),
    brand_color: args.brandColor,
    logo_url: args.logoUrl,
    email: args.email?.trim() || null,
    phone: args.phone?.trim() || null,
    address: args.address?.trim() || null,
    commune: args.commune?.trim() || null,
    quartier: args.quartier?.trim() || null,
  };

  const { error } = await supabase.from("schools").update(update as any).eq("id", staff.school_id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/school", "layout");
  return { ok: true };
}
