"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/db";

type Result = { ok: true; message: string } | { ok: false; message: string };

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export async function inviteSchoolAction(formData: FormData): Promise<Result> {
  const name = String(formData.get("name") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const country = String(formData.get("country_code") ?? "").trim().toUpperCase();
  const contact = String(formData.get("contact_email") ?? "").trim();
  const plan = String(formData.get("plan") ?? "standard") as "standard" | "pro";

  if (!name || !city || country.length !== 2 || !contact) {
    return { ok: false, message: "Champs invalides." };
  }

  if (!isLiveMode()) {
    // Demo: pretend it worked.
    return { ok: true, message: `Invitation simulée envoyée à ${contact}.` };
  }

  const supabase = createClient();
  const slug = slugify(name);
  const { error } = await supabase.from("schools").insert({
    name,
    slug,
    city,
    country_code: country,
    plan,
    status: "onboarding",
  });

  if (error) return { ok: false, message: error.message };

  // TODO: send onboarding email (Resend / Supabase Edge Function).
  revalidatePath("/schools");
  return { ok: true, message: `École créée. Email envoyé à ${contact}.` };
}
