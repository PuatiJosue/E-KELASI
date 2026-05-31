"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { ratelimit } from "@/lib/rate-limit";

export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    redirect(`/forgot-password?error=${encodeURIComponent("Email requis.")}`);
  }

  // Rate limit : 3 envois / 5 min par IP (limite le spam d'emails).
  const ip = headers().get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  if (!ratelimit(`pwreset:${ip}`, { limit: 3, windowMs: 5 * 60_000 })) {
    redirect(`/forgot-password?error=${encodeURIComponent("Trop d'envois. Réessaie plus tard.")}`);
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    redirect(`/forgot-password?error=${encodeURIComponent("Configuration manquante.")}`);
  }

  const supabase = createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/auth/confirm?next=/update-password`,
  });

  // On loggue côté serveur si erreur, mais on affiche TOUJOURS le même message
  // au client (évite l'énumération d'emails).
  if (error) console.warn("[forgot-password] reset error for", email.slice(0, 3) + "***", "-", error.message);

  redirect("/forgot-password?sent=1");
}
