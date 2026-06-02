"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/db";

type Result =
  | { ok: true; message: string; credentials?: { email: string; password: string; school: string } }
  | { ok: false; message: string };

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 56);
}

// Mot de passe temporaire robuste, 4 classes garanties, sans caractères ambigus.
function genPassword(len = 12): string {
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const digit = "23456789";
  const spec = "!@#$%&*?-";
  const all = lower + upper + digit + spec;
  const pick = (set: string) => set[crypto.randomInt(set.length)];
  const pw = [pick(lower), pick(upper), pick(digit), pick(spec)];
  while (pw.length < len) pw.push(pick(all));
  for (let i = pw.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [pw[i], pw[j]] = [pw[j], pw[i]];
  }
  return pw.join("");
}

export async function inviteSchoolAction(formData: FormData): Promise<Result> {
  const name = String(formData.get("name") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const country = String(formData.get("country_code") ?? "").trim().toUpperCase();
  const directorName = String(formData.get("director_name") ?? "").trim();
  const contact = String(formData.get("contact_email") ?? "").trim().toLowerCase();
  const plan = String(formData.get("plan") ?? "standard") as "standard" | "pro";

  if (!name || !city || country.length !== 2 || !contact || !directorName) {
    return { ok: false, message: "Champs invalides." };
  }

  if (!isLiveMode()) {
    return {
      ok: true,
      message: "Invitation simulée (mode démo).",
      credentials: { email: contact, password: genPassword(), school: name },
    };
  }

  // Sécurité : seul un super_admin peut inviter une école (on utilise ensuite
  // le service_role, donc il faut verrouiller l'appelant ici).
  const session = createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return { ok: false, message: "Non authentifié." };
  const { data: me } = await session
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (me?.role !== "super_admin") {
    return { ok: false, message: "Action réservée au super admin." };
  }

  const svc = service();

  // 1) Crée la fiche école (slug unique).
  const slug = slugify(name) + "-" + crypto.randomBytes(2).toString("hex");
  const { data: school, error: schoolErr } = await svc
    .from("schools")
    .insert({ name, slug, city, country_code: country, plan, status: "onboarding" })
    .select("id")
    .single();
  if (schoolErr || !school) {
    return { ok: false, message: "Création de l'école impossible." };
  }

  // 2) Crée le compte direction (déjà confirmé, mot de passe temporaire).
  const password = genPassword();
  const { data: created, error: authErr } = await svc.auth.admin.createUser({
    email: contact,
    password,
    email_confirm: true,
    user_metadata: { full_name: directorName },
  });
  if (authErr || !created?.user) {
    // Rollback de l'école pour ne pas laisser de fiche orpheline.
    await svc.from("schools").delete().eq("id", school.id);
    const dup = (authErr?.message ?? "").toLowerCase().includes("already");
    return {
      ok: false,
      message: dup ? "Cet email a déjà un compte. Utilise une autre adresse." : "Création du compte direction impossible.",
    };
  }
  const directorId = created.user.id;

  // 3) Profil direction + rattachement à l'école.
  const { error: profErr } = await svc.from("profiles").insert({
    id: directorId,
    email: contact,
    full_name: directorName,
    role: "school_admin",
    locale: "fr",
  });
  const { error: staffErr } = await svc.from("school_staff").insert({
    school_id: school.id,
    user_id: directorId,
    role: "school_admin",
  });
  if (profErr || staffErr) {
    // Rollback complet.
    await svc.auth.admin.deleteUser(directorId);
    await svc.from("schools").delete().eq("id", school.id);
    return { ok: false, message: "Rattachement de la direction impossible." };
  }

  revalidatePath("/schools");
  return {
    ok: true,
    message: `École « ${name} » créée. Transmets ces identifiants à la direction.`,
    credentials: { email: contact, password, school: name },
  };
}
