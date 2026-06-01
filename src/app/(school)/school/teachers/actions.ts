"use server";

import { revalidatePath } from "next/cache";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/db";

type GenResult =
  | { ok: true; code: string }
  | { ok: false; message: string };

type RedeemResult =
  | { ok: true }
  | { ok: false; message: string };

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// Alphabet sans caractères ambigus (0/O, 1/I/L) pour faciliter la dictée.
const ALPHABET = "ACDEFGHJKMNPQRTVWXY3479";
function generateCode(): string {
  let s = "";
  for (let i = 0; i < 8; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return s.slice(0, 4) + "-" + s.slice(4); // ex: XK3F-7P9M
}

// ── 1. École : générer un code d'accès pour un nouveau prof ──────────
export async function inviteTeacherAction(args: { fullName: string; address?: string }): Promise<GenResult> {
  const fullName = (args.fullName ?? "").trim();
  const address = (args.address ?? "").trim() || null;
  if (!fullName) return { ok: false, message: "Le nom est obligatoire." };
  if (fullName.length > 120) return { ok: false, message: "Nom trop long." };
  if (address && address.length > 240) return { ok: false, message: "Adresse trop longue." };
  if (!isLiveMode()) return { ok: true, code: generateCode() };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Non authentifié" };

  const { data: staff } = await supabase
    .from("school_staff")
    .select("school_id")
    .eq("user_id", user.id)
    .eq("role", "school_admin")
    .maybeSingle();
  if (!staff) return { ok: false, message: "Vous n'êtes pas direction d'une école." };

  // Génère un code unique (rétry max 5 si collision improbable).
  for (let tries = 0; tries < 5; tries++) {
    const code = generateCode();
    const { error } = await supabase.from("teacher_access_codes").insert({
      code,
      school_id: staff.school_id,
      full_name: fullName,
      address,
      created_by: user.id,
    });
    if (!error) {
      revalidatePath("/school/teachers");
      return { ok: true, code };
    }
    if (!error.message.toLowerCase().includes("duplicate")) {
      console.warn("[invite-teacher] insert error:", error.message);
      return { ok: false, message: "Impossible de générer le code." };
    }
  }
  return { ok: false, message: "Trop de collisions de code, réessaie." };
}

// ── 2. Prof : consommer un code pour créer son compte ────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function redeemTeacherCodeAction(args: {
  code: string;
  email: string;
  password: string;
}): Promise<RedeemResult> {
  const code = (args.code ?? "").trim().toUpperCase();
  const email = (args.email ?? "").trim().toLowerCase();
  const password = args.password ?? "";
  if (!code || !email || !password) return { ok: false, message: "Tous les champs sont obligatoires." };
  if (!EMAIL_RE.test(email)) return { ok: false, message: "Email invalide." };
  if (password.length < 8) return { ok: false, message: "Mot de passe : au moins 8 caractères." };

  if (!isLiveMode()) return { ok: true };

  const admin = service();

  // 1. Vérifie le code (encore non consommé)
  const { data: row, error: rowErr } = await admin
    .from("teacher_access_codes")
    .select("code, school_id, full_name, address, redeemed_at")
    .eq("code", code)
    .maybeSingle();
  if (rowErr) {
    console.warn("[redeem-teacher] read code error:", rowErr.message);
    return { ok: false, message: "Code invalide." };
  }
  if (!row) return { ok: false, message: "Code inconnu." };
  if (row.redeemed_at) return { ok: false, message: "Code déjà utilisé." };

  // 2. Crée l'utilisateur Supabase Auth
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createErr) {
    console.warn("[redeem-teacher] createUser error:", createErr.message);
    return { ok: false, message: "Impossible de créer le compte (email déjà utilisé ?)." };
  }
  const userId = created.user.id;

  // 3. Profil prof + lien school_staff (service_role contourne la RLS et le
  //    trigger lock_profile_role accepte service_role pour le rôle).
  await admin.from("profiles").upsert({
    id: userId,
    email,
    full_name: row.full_name,
    address: row.address,
    role: "teacher",
    locale: "fr",
  });

  const { error: staffErr } = await admin
    .from("school_staff")
    .upsert(
      { school_id: row.school_id, user_id: userId, role: "teacher" },
      { onConflict: "school_id,user_id" }
    );
  if (staffErr) {
    console.warn("[redeem-teacher] staff upsert error:", staffErr.message);
    return { ok: false, message: "Liaison à l'école échouée." };
  }

  // 4. Marque le code comme consommé
  await admin
    .from("teacher_access_codes")
    .update({ redeemed_by: userId, redeemed_at: new Date().toISOString() })
    .eq("code", code);

  revalidatePath("/school/teachers");
  return { ok: true };
}

// ── 3. École : supprimer (révoquer) un code non consommé ─────────────
export async function revokeTeacherCodeAction(code: string): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!isLiveMode()) return { ok: true };
  const supabase = createClient();
  const { error } = await supabase.from("teacher_access_codes").delete().eq("code", code).is("redeemed_at", null);
  if (error) {
    console.warn("[revoke-teacher-code]", error.message);
    return { ok: false, message: "Révocation refusée." };
  }
  revalidatePath("/school/teachers");
  return { ok: true };
}
