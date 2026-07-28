"use server";

import { revalidatePath } from "next/cache";
import { serviceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/env";
import type { MessageResult as Result } from "@/lib/result";


const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Met à jour le nom et l'email de l'utilisateur CONNECTÉ (tous rôles web).
export async function updateProfileAction(formData: FormData): Promise<Result> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!fullName) return { ok: false, message: "Le nom est obligatoire." };
  if (fullName.length > 120) return { ok: false, message: "Nom trop long." };
  if (!EMAIL_RE.test(email)) return { ok: false, message: "Email invalide." };

  if (!isLiveMode()) return { ok: true, message: "Modifié (mode démo)." };

  const session = createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return { ok: false, message: "Non authentifié." };

  const svc = serviceClient();

  if (email !== (user.email ?? "").toLowerCase()) {
    const { error: authErr } = await svc.auth.admin.updateUserById(user.id, {
      email,
      email_confirm: true,
    });
    if (authErr) {
      const taken = (authErr.message ?? "").toLowerCase().includes("already") ||
        (authErr.message ?? "").toLowerCase().includes("registered");
      return { ok: false, message: taken ? "Cet email est déjà utilisé." : "Mise à jour de l'email impossible." };
    }
  }

  const { error: profErr } = await svc
    .from("profiles")
    .update({ full_name: fullName, email })
    .eq("id", user.id);
  if (profErr) {
    const taken = (profErr.message ?? "").toLowerCase().includes("duplicate");
    return { ok: false, message: taken ? "Cet email est déjà utilisé." : "Enregistrement impossible." };
  }

  // Rafraîchit les pages de réglages des 3 espaces.
  revalidatePath("/settings");
  revalidatePath("/school/settings");
  revalidatePath("/teacher/profile");
  return { ok: true, message: "Profil mis à jour ✅" };
}
