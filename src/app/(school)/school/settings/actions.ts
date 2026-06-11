"use server";

import { revalidatePath } from "next/cache";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/db";

type Result = { ok: true; message: string } | { ok: false; message: string };

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// La direction met à jour les coordonnées + le contact de SON école.
export async function updateSchoolContactAction(formData: FormData): Promise<Result> {
  const commune = String(formData.get("commune") ?? "").trim() || null;
  const quartier = String(formData.get("quartier") ?? "").trim() || null;
  const address = String(formData.get("address") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;

  if (!isLiveMode()) return { ok: true, message: "Enregistré (démo)." };

  const session = createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return { ok: false, message: "Non authentifié." };
  const { data: staff } = await session
    .from("school_staff")
    .select("school_id")
    .eq("user_id", user.id)
    .eq("role", "school_admin")
    .maybeSingle();
  if (!staff) return { ok: false, message: "Réservé à la direction." };

  const svc = service();
  const { error } = await svc
    .from("schools")
    .update({ commune, quartier, address, phone })
    .eq("id", staff.school_id);
  if (error) return { ok: false, message: "Enregistrement impossible." };

  revalidatePath("/school/settings");
  return { ok: true, message: "Coordonnées mises à jour ✅" };
}
