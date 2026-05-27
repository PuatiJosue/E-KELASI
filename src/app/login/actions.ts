"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  // If Supabase env vars are missing, fall through to the demo dashboard.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    redirect("/overview");
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    redirect(`/login?error=${encodeURIComponent(error?.message ?? "login failed")}`);
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
  // parent → cette console n'est pas pour eux, mais on évite le crash
  redirect("/overview");
}
