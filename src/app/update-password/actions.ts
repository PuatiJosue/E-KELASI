"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updatePasswordAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirm  = String(formData.get("confirm") ?? "");

  if (password.length < 8) {
    redirect("/update-password?error=" + encodeURIComponent("Au moins 8 caractères."));
  }
  if (password !== confirm) {
    redirect("/update-password?error=" + encodeURIComponent("Les mots de passe ne correspondent pas."));
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    redirect("/login");
  }

  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    console.warn("[update-password] error:", error.message);
    redirect("/update-password?error=" + encodeURIComponent("Mise à jour impossible. Redemande un nouveau lien."));
  }

  redirect("/login?reset=ok");
}
