"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/db";

type Result = { ok: true } | { ok: false; message: string };

async function requireSuperAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null as null, ok: false as const };
  const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return { supabase, user, ok: prof?.role === "super_admin" };
}

export async function createPlatformBook(args: {
  title: string;
  author: string;
  description: string | null;
  coverUrl: string | null;
  gradeLevel: string | null;
  filePath: string;
  fileFormat: "pdf" | "epub";
  priceCents: number;
  currency: string;
}): Promise<Result> {
  if (!isLiveMode()) return { ok: true };
  if (!args.title?.trim() || !args.author?.trim()) return { ok: false, message: "Titre et auteur requis." };
  if (!args.filePath) return { ok: false, message: "Fichier PDF/EPUB requis." };
  if (!Number.isFinite(args.priceCents) || args.priceCents < 0) return { ok: false, message: "Prix invalide." };

  const { supabase, user, ok } = await requireSuperAdmin();
  if (!user) return { ok: false, message: "Non authentifié." };
  if (!ok) return { ok: false, message: "Réservé au super admin." };

  const { error } = await supabase.from("library_books").insert({
    school_id: null,
    added_by: user.id,
    title: args.title.trim(),
    author: args.author.trim(),
    description: args.description?.trim() || null,
    cover_url: args.coverUrl,
    grade_level: args.gradeLevel || null,
    file_path: args.filePath,
    file_format: args.fileFormat,
    price_cents: Math.round(args.priceCents),
    currency: (args.currency || "USD").toUpperCase().slice(0, 3),
  });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/library");
  return { ok: true };
}

export async function deletePlatformBook(id: string): Promise<Result> {
  if (!isLiveMode()) return { ok: true };
  const { supabase, user, ok } = await requireSuperAdmin();
  if (!user) return { ok: false, message: "Non authentifié." };
  if (!ok) return { ok: false, message: "Réservé au super admin." };

  // Récupère le chemin du fichier pour le supprimer du storage aussi.
  const { data: book } = await supabase.from("library_books").select("file_path").eq("id", id).maybeSingle();
  const { error } = await supabase.from("library_books").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  if (book?.file_path) {
    await supabase.storage.from("library-files").remove([book.file_path]).catch(() => {});
  }

  revalidatePath("/library");
  return { ok: true };
}
