"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/db";

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// Alphabet sans caractères ambigus — identique aux codes écoles/profs.
const CODE_ALPHABET = "ACDEFGHJKMNPQRTVWXY3479";
function generateCode(): string {
  let s = "";
  for (let i = 0; i < 8; i++) s += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
  return s.slice(0, 4) + "-" + s.slice(4);
}

// Vérifie que l'appelant est super admin (garde avant tout usage du service_role).
async function requireSuperAdmin(): Promise<string | null> {
  const session = createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return null;
  const { data: me } = await session.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return me?.role === "super_admin" ? user.id : null;
}

// ── 1. Inviter un membre : génère un code d'accès super admin ─────────
export async function inviteAdminAction(args: { fullName: string }): Promise<
  { ok: true; code: string } | { ok: false; message: string }
> {
  const fullName = (args.fullName ?? "").trim();
  if (!fullName) return { ok: false, message: "Le nom est obligatoire." };
  if (fullName.length > 120) return { ok: false, message: "Nom trop long." };
  if (!isLiveMode()) return { ok: true, code: generateCode() };

  const adminId = await requireSuperAdmin();
  if (!adminId) return { ok: false, message: "Action réservée au super admin." };

  const svc = service();
  for (let tries = 0; tries < 5; tries++) {
    const code = generateCode();
    const { error } = await svc.from("admin_access_codes").insert({
      code,
      full_name: fullName,
      created_by: adminId,
    });
    if (!error) {
      revalidatePath("/team");
      return { ok: true, code };
    }
    if (!error.message.toLowerCase().includes("duplicate")) {
      return { ok: false, message: "Impossible de générer le code." };
    }
  }
  return { ok: false, message: "Trop de collisions de code, réessaie." };
}

// ── 2. Consommer un code pour créer son compte super admin ───────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function redeemAdminCodeAction(args: {
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

  const admin = service();
  const { data: row, error: rowErr } = await admin
    .from("admin_access_codes")
    .select("code, full_name, redeemed_at")
    .eq("code", code)
    .maybeSingle();
  if (rowErr) return { ok: false, message: "Code invalide." };
  if (!row) return { ok: false, message: "Code inconnu." };
  if (row.redeemed_at) return { ok: false, message: "Code déjà utilisé." };

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: row.full_name ?? undefined },
  });
  if (createErr || !created?.user) {
    return { ok: false, message: "Impossible de créer le compte (email déjà utilisé ?)." };
  }
  const userId = created.user.id;

  await admin.from("profiles").upsert({
    id: userId,
    email,
    full_name: row.full_name ?? email,
    role: "super_admin",
    locale: "fr",
  });

  await admin
    .from("admin_access_codes")
    .update({ redeemed_by: userId, redeemed_at: new Date().toISOString() })
    .eq("code", code);

  return { ok: true };
}

// ── 3. Modifier les informations d'un membre ─────────────────────────
export async function updateMemberAction(args: {
  userId: string;
  fullName: string;
  phone?: string;
  address?: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const fullName = (args.fullName ?? "").trim();
  if (!fullName) return { ok: false, message: "Le nom est obligatoire." };
  if (!isLiveMode()) return { ok: true };

  const adminId = await requireSuperAdmin();
  if (!adminId) return { ok: false, message: "Action réservée au super admin." };

  const svc = service();
  const { error } = await svc
    .from("profiles")
    .update({
      full_name: fullName,
      phone: (args.phone ?? "").trim() || null,
      address: (args.address ?? "").trim() || null,
    })
    .eq("id", args.userId);
  if (error) return { ok: false, message: "Mise à jour impossible." };
  revalidatePath("/team");
  return { ok: true };
}

// ── 4. Attacher un document à un membre ──────────────────────────────
const MAX_DOC_BYTES = 8 * 1024 * 1024;

export async function uploadMemberDocAction(formData: FormData): Promise<
  { ok: true } | { ok: false; message: string }
> {
  const userId = String(formData.get("userId") ?? "");
  const file = formData.get("file");
  if (!userId || !(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Document manquant." };
  }
  if (file.size > MAX_DOC_BYTES) return { ok: false, message: "Le document dépasse 8 Mo." };
  if (!isLiveMode()) return { ok: true };

  const adminId = await requireSuperAdmin();
  if (!adminId) return { ok: false, message: "Action réservée au super admin." };

  const svc = service();
  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const safeName = (file.name || "document").replace(/[^\w.\-]/g, "_");
    const path = `${userId}/${crypto.randomUUID()}-${safeName}`;
    const { error: upErr } = await svc.storage
      .from("profile-docs")
      .upload(path, bytes, { contentType: file.type || "application/octet-stream", upsert: true });
    if (upErr) return { ok: false, message: "Téléversement impossible." };
    const { data: signed } = await svc.storage.from("profile-docs").createSignedUrl(path, 60 * 60 * 24 * 365);
    const { error } = await svc.from("profile_documents").insert({
      profile_id: userId,
      name: file.name || safeName,
      url: signed?.signedUrl ?? path,
      created_by: adminId,
    });
    if (error) return { ok: false, message: "Enregistrement du document impossible." };
  } catch {
    return { ok: false, message: "Téléversement impossible." };
  }
  revalidatePath("/team");
  return { ok: true };
}

// ── 5. Supprimer un document d'un membre ─────────────────────────────
export async function deleteMemberDocAction(id: string): Promise<
  { ok: true } | { ok: false; message: string }
> {
  if (!isLiveMode()) return { ok: true };
  const adminId = await requireSuperAdmin();
  if (!adminId) return { ok: false, message: "Action réservée au super admin." };
  const svc = service();
  const { error } = await svc.from("profile_documents").delete().eq("id", id);
  if (error) return { ok: false, message: "Suppression impossible." };
  revalidatePath("/team");
  return { ok: true };
}
