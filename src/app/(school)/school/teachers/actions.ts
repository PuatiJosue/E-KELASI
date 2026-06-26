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

// École connectée → school_id si elle est direction, sinon null.
async function callerSchoolId(): Promise<string | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: staff } = await supabase
    .from("school_staff")
    .select("school_id")
    .eq("user_id", user.id)
    .eq("role", "school_admin")
    .maybeSingle();
  return staff?.school_id ?? null;
}

// ── 1. École : générer un code d'accès DEPUIS la fiche du prof ───────
// La direction a déjà rempli la fiche (identité, cours, classes, options) ;
// on génère un code rattaché à cette fiche, pré-rempli avec son identité.
// Régénération : tout code en attente pour cette fiche est d'abord révoqué.
export async function generateCodeForStaffAction(staffId: string): Promise<GenResult> {
  if (!staffId) return { ok: false, message: "Fiche invalide." };
  if (!isLiveMode()) return { ok: true, code: generateCode() };

  const schoolId = await callerSchoolId();
  if (!schoolId) return { ok: false, message: "Action réservée à la direction." };

  const { data: { user } } = await createClient().auth.getUser();
  const admin = service();

  // Lit la fiche (service role) en vérifiant qu'elle appartient à l'école.
  const { data: member } = await admin
    .from("staff_members")
    .select("id, full_name, address, category, linked_user_id")
    .eq("id", staffId)
    .eq("school_id", schoolId)
    .maybeSingle();
  if (!member) return { ok: false, message: "Fiche introuvable." };
  if (member.linked_user_id) return { ok: false, message: "Ce prof a déjà un compte actif." };
  if (member.category !== "enseignant") return { ok: false, message: "Réservé aux enseignants." };
  if (!member.full_name?.trim()) return { ok: false, message: "Complétez d'abord le nom de la fiche." };

  // Révoque un éventuel code en attente pour cette fiche (régénération).
  await admin.from("teacher_access_codes").delete().eq("staff_id", staffId).is("redeemed_at", null);

  for (let tries = 0; tries < 5; tries++) {
    const code = generateCode();
    const { error } = await admin.from("teacher_access_codes").insert({
      code,
      school_id: schoolId,
      staff_id: staffId,
      full_name: member.full_name,
      address: member.address ?? null,
      created_by: user?.id ?? null,
    });
    if (!error) {
      revalidatePath("/school/staff");
      revalidatePath("/school/teachers");
      return { ok: true, code };
    }
    if (!error.message.toLowerCase().includes("duplicate")) {
      console.warn("[generate-staff-code] insert error:", error.message);
      return { ok: false, message: "Impossible de générer le code." };
    }
  }
  return { ok: false, message: "Trop de collisions de code, réessaie." };
}

// ── 1b. École : révoquer le code en attente d'une fiche ──────────────
export async function revokeStaffCodeAction(staffId: string): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!staffId) return { ok: false, message: "Fiche invalide." };
  if (!isLiveMode()) return { ok: true };
  const schoolId = await callerSchoolId();
  if (!schoolId) return { ok: false, message: "Action réservée à la direction." };
  const admin = service();
  const { error } = await admin
    .from("teacher_access_codes")
    .delete()
    .eq("staff_id", staffId)
    .eq("school_id", schoolId)
    .is("redeemed_at", null);
  if (error) return { ok: false, message: "Révocation refusée." };
  revalidatePath("/school/staff");
  return { ok: true };
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
    .select("code, school_id, staff_id, full_name, address, redeemed_at")
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

  // 4. Rattache le compte créé à la fiche du personnel (le cas échéant)
  if (row.staff_id) {
    const { error: linkErr } = await admin
      .from("staff_members")
      .update({ linked_user_id: userId })
      .eq("id", row.staff_id);
    if (linkErr) console.warn("[redeem-teacher] link staff error:", linkErr.message);
  }

  // 5. Marque le code comme consommé
  await admin
    .from("teacher_access_codes")
    .update({ redeemed_by: userId, redeemed_at: new Date().toISOString() })
    .eq("code", code);

  revalidatePath("/school/teachers");
  revalidatePath("/school/staff");
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
