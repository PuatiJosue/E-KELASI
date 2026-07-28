"use server";

import { revalidatePath } from "next/cache";
import { serviceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/env";
import type { Result } from "@/lib/result";


async function superAdmin(): Promise<string | null> {
  const session = createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return null;
  const { data: prof } = await session.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return prof?.role === "super_admin" ? user.id : null;
}

export async function createPlatformAnnouncement(input: {
  title: string;
  body: string;
  audience: "all" | "parents" | "schools";
}): Promise<Result> {
  const title = input.title?.trim();
  const body = input.body?.trim();
  if (!title || !body) return { ok: false, message: "Titre et message requis." };
  const audience = ["all", "parents", "schools"].includes(input.audience) ? input.audience : "all";
  if (!isLiveMode()) return { ok: true };

  const uid = await superAdmin();
  if (!uid) return { ok: false, message: "Réservé au super-admin." };

  const svc = serviceClient();
  const { error } = await svc.from("platform_announcements").insert({ title, body, audience, created_by: uid });
  if (error) return { ok: false, message: "Publication impossible." };

  // Parents : notification dans l'app (table notifications, lue par l'app actuelle).
  if (audience === "all" || audience === "parents") {
    try {
      const { data: parents } = await svc.from("profiles").select("id").eq("role", "parent");
      const ids = (parents ?? []).map((p: any) => p.id);
      if (ids.length > 0) {
        const rows = ids.map((id: string) => ({ user_id: id, kind: "school" as const, body: `📣 E-KLASS : ${title}` }));
        // Insertion par paquets de 500 pour rester raisonnable.
        for (let i = 0; i < rows.length; i += 500) {
          await svc.from("notifications").insert(rows.slice(i, i + 500));
        }
      }
    } catch {
      // notification best effort
    }
  }

  revalidatePath("/broadcast");
  return { ok: true };
}

export async function deletePlatformAnnouncement(id: string): Promise<Result> {
  if (!id) return { ok: false, message: "Annonce invalide." };
  if (!isLiveMode()) return { ok: true };
  const uid = await superAdmin();
  if (!uid) return { ok: false, message: "Réservé au super-admin." };
  const svc = serviceClient();
  const { error } = await svc.from("platform_announcements").delete().eq("id", id);
  if (error) return { ok: false, message: "Suppression impossible." };
  revalidatePath("/broadcast");
  return { ok: true };
}
