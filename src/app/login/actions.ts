"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { ratelimit, checkLockout, recordFailure, clearFailures } from "@/lib/rate-limit";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  // If Supabase env vars are missing, fall through to the demo dashboard (dev only).
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    if (process.env.NODE_ENV === "production") {
      redirect(`/login?error=${encodeURIComponent("Configuration manquante.")}`);
    }
    redirect("/overview");
  }

  // Rate limit : 5 tentatives / minute par IP (anti brute-force).
  const ip = headers().get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  if (!ratelimit(`login:${ip}`, { limit: 5, windowMs: 60_000 })) {
    redirect(`/login?error=${encodeURIComponent("Trop de tentatives. Réessaie dans une minute.")}`);
  }

  // Verrouillage par compte : après 5 échecs sur le même email, on bloque
  // 15 min — stoppe le brute-force ciblé même si l'attaquant change d'IP.
  const emailKey = `loginfail:${email.toLowerCase().trim()}`;
  const lockedMs = checkLockout(emailKey);
  if (lockedMs > 0) {
    const mins = Math.ceil(lockedMs / 60_000);
    redirect(`/login?error=${encodeURIComponent(`Trop d'échecs. Compte bloqué ${mins} min par sécurité.`)}`);
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    // Message volontairement vague : ne pas révéler si l'email existe ou pas.
    if (error) console.warn("[login] failed signin for", email.slice(0, 3) + "***", "-", error.message);
    recordFailure(emailKey, { maxFailures: 5, windowMs: 15 * 60_000, lockMs: 15 * 60_000 });
    redirect(`/login?error=${encodeURIComponent("Email ou mot de passe incorrect.")}`);
  }

  // Connexion réussie : on efface le compteur d'échecs de ce compte.
  clearFailures(emailKey);

  // Redirige selon le rôle
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  const role = profile?.role;
  if (role === "teacher") redirect("/teacher/dashboard");
  if (role === "school_admin") redirect("/school/overview");
  if (role === "super_admin") redirect("/overview");
  if (role === "surveillant") redirect("/surveillant/presences");

  // Parent ou compte sans rôle : l'espace web est réservé au personnel scolaire.
  // On déconnecte et on informe (les parents utilisent l'app mobile).
  await supabase.auth.signOut();
  redirect(`/login?error=${encodeURIComponent("Espace réservé aux écoles et au personnel scolaire. Les parents utilisent l'application mobile E-KLASS.")}`);
}
