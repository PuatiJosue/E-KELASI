// POST /api/stripe/book-checkout
// Crée une session Stripe Checkout en PAIEMENT UNIQUE pour acheter un livre de
// la bibliothèque. Auth via le token Supabase du parent (app mobile).
// Au paiement, le webhook (checkout.session.completed) marque l'achat 'paid'
// et le parent obtient l'accès au fichier PDF/EPUB.

import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SR = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  try {
    const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
    if (!token) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

    const supa = createClient(URL, ANON, { auth: { persistSession: false } });
    const { data: { user } } = await supa.auth.getUser(token);
    if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

    const b = (await req.json().catch(() => ({}))) as any;
    const bookId = String(b.bookId ?? "").trim();
    if (!bookId) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

    const svc = createClient(URL, SR, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: book } = await svc
      .from("library_books")
      .select("id, title, author, cover_url, price_cents, currency")
      .eq("id", bookId)
      .maybeSingle();
    if (!book) return NextResponse.json({ error: "book_not_found" }, { status: 404 });
    if (!book.price_cents || book.price_cents <= 0) {
      return NextResponse.json({ error: "book_is_free" }, { status: 400 });
    }

    // Déjà acheté ? inutile de repayer.
    const { data: owned } = await svc
      .from("library_purchases")
      .select("id")
      .eq("book_id", bookId)
      .eq("parent_id", user.id)
      .eq("status", "paid")
      .maybeSingle();
    if (owned) return NextResponse.json({ error: "already_owned" }, { status: 409 });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      customer_email: user.email ?? undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: (book.currency ?? "USD").toLowerCase(),
            unit_amount: book.price_cents,
            product_data: {
              name: book.title,
              description: book.author ?? undefined,
              images: book.cover_url ? [book.cover_url] : undefined,
            },
          },
        },
      ],
      success_url: `${appUrl}/library/success?book=${encodeURIComponent(bookId)}`,
      cancel_url: `${appUrl}/library/canceled`,
      metadata: { kind: "book_purchase", book_id: bookId, parent_id: user.id },
    });

    // Trace l'achat en attente (réconcilié par le webhook via l'ID de session).
    await svc.from("library_purchases").insert({
      book_id: bookId,
      parent_id: user.id,
      amount_cents: book.price_cents,
      currency: book.currency ?? "USD",
      method: "stripe",
      status: "pending",
      stripe_session_id: session.id,
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    console.error("[book-checkout]", e?.message ?? e);
    return NextResponse.json({ error: "checkout_failed" }, { status: 500 });
  }
}
