"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { serviceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/env";
import { createUserErrorMessage } from "@/lib/auth-errors";

type Result =
  | { ok: true; message: string; invite?: { code: string; school: string } }
  | { ok: false; message: string };

// Alphabet sans caractères ambigus (0/O, 1/I/L) pour faciliter la dictée —
// identique aux codes profs.
const CODE_ALPHABET = "ACDEFGHJKMNPQRTVWXY3479";
function generateCode(): string {
  let s = "";
  for (let i = 0; i < 8; i++) s += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
  return s.slice(0, 4) + "-" + s.slice(4); // ex: XK3F-7P9M
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

const MAX_DOC_BYTES = 8 * 1024 * 1024; // 8 Mo (= limite du bucket school-docs)

export async function inviteSchoolAction(formData: FormData): Promise<Result> {
  const name = String(formData.get("name") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const country = String(formData.get("country_code") ?? "").trim().toUpperCase();
  const directorName = String(formData.get("director_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const docs = formData.getAll("documents").filter((d): d is File => d instanceof File && d.size > 0);

  if (!name || !city || country.length !== 2 || !directorName) {
    return { ok: false, message: "Champs invalides." };
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: "Email de l'école invalide." };
  }
  for (const d of docs) {
    if (d.size > MAX_DOC_BYTES) return { ok: false, message: `Le document « ${d.name} » dépasse 8 Mo.` };
  }

  if (!isLiveMode()) {
    return {
      ok: true,
      message: "Invitation simulée (mode démo).",
      invite: { code: generateCode(), school: name },
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

  const svc = serviceClient();

  // 1) Crée la fiche école (slug unique, plan standard par défaut).
  const slug = slugify(name) + "-" + crypto.randomBytes(2).toString("hex");
  const { data: school, error: schoolErr } = await svc
    .from("schools")
    .insert({
      name,
      slug,
      city,
      country_code: country,
      plan: "standard",
      status: "onboarding",
      director_name: directorName,
      email: email || null,
      phone: phone || null,
      address: address || null,
      notes: notes || null,
    })
    .select("id")
    .single();
  if (schoolErr || !school) {
    return { ok: false, message: "Création de l'école impossible." };
  }

  // 2) Documents attachés (optionnels) → bucket privé + fiche school_documents.
  for (const file of docs) {
    try {
      const bytes = Buffer.from(await file.arrayBuffer());
      const safeName = (file.name || "document").replace(/[^\w.\-]/g, "_");
      const path = `${school.id}/${crypto.randomUUID()}-${safeName}`;
      const { error: upErr } = await svc.storage
        .from("school-docs")
        .upload(path, bytes, { contentType: file.type || "application/octet-stream", upsert: true });
      if (upErr) continue; // best-effort : on n'échoue pas l'invitation pour un doc
      const { data: signed } = await svc.storage.from("school-docs").createSignedUrl(path, 60 * 60 * 24 * 365);
      await svc.from("school_documents").insert({
        school_id: school.id,
        name: file.name || safeName,
        url: signed?.signedUrl ?? path,
        created_by: user.id,
      });
    } catch {
      // best-effort
    }
  }

  // 3) Génère un code d'accès unique (rétry max 5 si collision improbable).
  for (let tries = 0; tries < 5; tries++) {
    const code = generateCode();
    const { error } = await svc.from("school_access_codes").insert({
      code,
      school_id: school.id,
      director_name: directorName,
      created_by: user.id,
    });
    if (!error) {
      revalidatePath("/schools");
      return {
        ok: true,
        message: `École « ${name} » créée. Transmets ce code d'accès à la direction.`,
        invite: { code, school: name },
      };
    }
    if (!error.message.toLowerCase().includes("duplicate")) {
      return { ok: false, message: "Impossible de générer le code d'accès." };
    }
  }
  return { ok: false, message: "Trop de collisions de code, réessaie." };
}

// ── Archivage d'une école ────────────────────────────────────────────
// Volontairement PAS de suppression : `schools` est référencée par 36 tables
// en `on delete cascade` (une suppression effacerait élèves, notes, paiements
// et factures sans retour) et `students.school_id` est en `on delete restrict`,
// ce qui bloquerait de toute façon toute école ayant un élève. On bascule donc
// le statut sur 'churned' : l'école sort de la liste active, rien n'est perdu,
// et l'opération se défait.
export async function setSchoolArchivedAction(
  schoolId: string,
  archived: boolean
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!schoolId) return { ok: false, message: "École invalide." };
  if (!isLiveMode()) return { ok: true };

  // Sécurité : on passe ensuite par le service_role, donc l'appelant doit être
  // verrouillé ici (même contrôle que inviteSchoolAction).
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

  const { error } = await serviceClient()
    .from("schools")
    .update({ status: archived ? "churned" : "active", updated_at: new Date().toISOString() })
    .eq("id", schoolId);
  if (error) return { ok: false, message: "Mise à jour impossible." };

  revalidatePath("/schools");
  revalidatePath(`/schools/${schoolId}`);
  return { ok: true };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// L'école consomme son code d'accès sur /school-signup pour créer son compte
// direction (email + mot de passe choisis par elle). Calqué sur les profs.
export async function redeemSchoolCodeAction(args: {
  code: string;
  email: string;
  password: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const code = (args.code ?? "").trim().toUpperCase();
  const email = (args.email ?? "").trim().toLowerCase();
  const password = args.password ?? "";
  if (!code || !email || !password) return { ok: false, message: "Tous les champs sont obligatoires." };
  if (!EMAIL_RE.test(email)) return { ok: false, message: "Email invalide." };
  if (password.length < 8) return { ok: false, message: "Mot de passe : au moins 8 caractères." };

  if (!isLiveMode()) return { ok: true };

  const admin = serviceClient();

  // 1. Vérifie le code (encore non consommé).
  const { data: row, error: rowErr } = await admin
    .from("school_access_codes")
    .select("code, school_id, director_name, redeemed_at")
    .eq("code", code)
    .maybeSingle();
  if (rowErr) return { ok: false, message: "Code invalide." };
  if (!row) return { ok: false, message: "Code inconnu." };
  if (row.redeemed_at) return { ok: false, message: "Code déjà utilisé." };

  // 2. Crée l'utilisateur Supabase Auth (confirmé d'office).
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: row.director_name ?? undefined },
  });
  if (createErr || !created?.user) {
    console.warn("[redeem-school] createUser error:", createErr?.message);
    return { ok: false, message: createUserErrorMessage(createErr?.message) };
  }
  const userId = created.user.id;

  // 3. Profil direction + lien school_staff (service_role contourne la RLS).
  await admin.from("profiles").upsert({
    id: userId,
    email,
    full_name: row.director_name ?? email,
    role: "school_admin",
    locale: "fr",
  });
  const { error: staffErr } = await admin
    .from("school_staff")
    .upsert(
      { school_id: row.school_id, user_id: userId, role: "school_admin" },
      { onConflict: "school_id,user_id" }
    );
  if (staffErr) return { ok: false, message: "Liaison à l'école échouée." };

  // 4. École active + code marqué consommé.
  await admin.from("schools").update({ status: "active" }).eq("id", row.school_id);
  await admin
    .from("school_access_codes")
    .update({ redeemed_by: userId, redeemed_at: new Date().toISOString() })
    .eq("code", code);

  return { ok: true };
}
