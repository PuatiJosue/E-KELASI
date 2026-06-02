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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function updateProfileAction(formData: FormData): Promise<Result> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!fullName) return { ok: false, message: "Le nom est obligatoire." };
  if (fullName.length > 120) return { ok: false, message: "Nom trop long." };
  if (!EMAIL_RE.test(email)) return { ok: false, message: "Email invalide." };

  if (!isLiveMode()) return { ok: true, message: "Modifié (mode démo)." };

  // Seul l'utilisateur connecté peut modifier son propre compte.
  const session = createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return { ok: false, message: "Non authentifié." };

  const svc = service();

  // Si l'email change : mise à jour de l'auth (confirmé directement, sans
  // email de validation — adapté au contexte où l'email est peu fiable).
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

  // Mise à jour du profil (nom + email synchronisés).
  const { error: profErr } = await svc
    .from("profiles")
    .update({ full_name: fullName, email })
    .eq("id", user.id);
  if (profErr) {
    const taken = (profErr.message ?? "").toLowerCase().includes("duplicate");
    return { ok: false, message: taken ? "Cet email est déjà utilisé." : "Enregistrement impossible." };
  }

  revalidatePath("/settings");
  return { ok: true, message: "Profil mis à jour ✅" };
}
