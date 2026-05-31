"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { ratelimit } from "@/lib/rate-limit";

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

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    // Message volontairement vague : ne pas révéler si l'email existe ou pas.
    if (error) console.warn("[login] failed signin for", email.slice(0, 3) + "***", "-", error.message);
    redirect(`/login?error=${encodeURIComponent("Email ou mot de passe incorrect.")}`);
  }

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
  redirect("/overview");
}
