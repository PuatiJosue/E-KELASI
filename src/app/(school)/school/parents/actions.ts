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

// Bloque ou débloque l'accès d'un parent — réservé à la direction de SON école.
export async function setParentAccess(parentId: string, block: boolean): Promise<Result> {
  if (!parentId) return { ok: false, message: "Parent invalide." };
  if (!isLiveMode()) return { ok: true };

  const session = createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return { ok: false, message: "Non authentifié." };

  const { data: staff } = await session
    .from("school_staff")
    .select("school_id")
    .eq("user_id", user.id)
    .eq("role", "school_admin")
    .maybeSingle();
  if (!staff) return { ok: false, message: "Action réservée à la direction." };

  const svc = service();
  // Élèves de l'école → on ne touche QUE les liens vers ces élèves.
  const { data: students } = await svc.from("students").select("id").eq("school_id", staff.school_id);
  const ids = (students ?? []).map((s: any) => s.id);
  if (ids.length === 0) return { ok: false, message: "Aucun élève dans l'école." };

  const { error } = await svc
    .from("parent_links")
    .update({ access_status: block ? "blocked" : "active" })
    .eq("parent_id", parentId)
    .in("student_id", ids);
  if (error) return { ok: false, message: "Échec de la mise à jour." };

  revalidatePath("/school/parents");
  return { ok: true };
}
