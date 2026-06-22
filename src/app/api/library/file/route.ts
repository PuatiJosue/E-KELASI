// GET /api/library/file?bookId=...
// Renvoie une URL signée (60 min) vers le fichier PDF/EPUB d'un livre, UNIQUEMENT
// si le parent connecté l'a acheté (achat 'paid') — ou si c'est le super admin.
// Auth via le token Supabase (app mobile : Authorization: Bearer <token>).

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SR = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(req: NextRequest) {
  try {
    const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
    if (!token) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

    const bookId = req.nextUrl.searchParams.get("bookId")?.trim();
    if (!bookId) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

    const supa = createClient(URL, ANON, { auth: { persistSession: false } });
    const { data: { user } } = await supa.auth.getUser(token);
    if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

    const svc = createClient(URL, SR, { auth: { autoRefreshToken: false, persistSession: false } });

    const { data: book } = await svc
      .from("library_books")
      .select("id, file_path, file_format, price_cents")
      .eq("id", bookId)
      .maybeSingle();
    if (!book || !book.file_path) return NextResponse.json({ error: "no_file" }, { status: 404 });

    // Accès autorisé si : livre gratuit, OU achat payé, OU super admin.
    let allowed = !book.price_cents || book.price_cents <= 0;
    if (!allowed) {
      const { data: purchase } = await svc
        .from("library_purchases")
        .select("id")
        .eq("book_id", bookId)
        .eq("parent_id", user.id)
        .eq("status", "paid")
        .maybeSingle();
      allowed = !!purchase;
    }
    if (!allowed) {
      const { data: prof } = await svc.from("profiles").select("role").eq("id", user.id).maybeSingle();
      if ((prof as any)?.role === "super_admin") allowed = true;
    }
    if (!allowed) return NextResponse.json({ error: "not_owned" }, { status: 403 });

    const { data: signed, error } = await svc.storage
      .from("library-files")
      .createSignedUrl(book.file_path, 60 * 60);
    if (error || !signed?.signedUrl) {
      return NextResponse.json({ error: "sign_failed" }, { status: 500 });
    }

    return NextResponse.json({ url: signed.signedUrl, format: book.file_format ?? null });
  } catch (e: any) {
    console.error("[library/file]", e?.message ?? e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
