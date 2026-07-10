// Callback pour les emails Supabase (reset password, confirmation, magic link).
// Le lien envoyé pointe ici avec `?token_hash=...&type=...&next=...`.
// On échange le token contre une session (cookies), puis on redirige vers `next`.

import { type NextRequest, NextResponse } from "next/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  // Flux PKCE (par défaut avec @supabase/ssr) : Supabase renvoie `?code=...`.
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/overview";

  const supabase = createClient();

  // Cas 1 — flux PKCE : on échange le code contre une session.
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.warn("[auth/confirm] exchangeCodeForSession error:", error.message);
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("Lien expiré ou invalide.")}`);
    }
    return NextResponse.redirect(`${origin}${next}`);
  }

  // Cas 2 — flux OTP (template email avec token_hash) : on vérifie l'OTP.
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (error) {
      console.warn("[auth/confirm] verifyOtp error:", error.message);
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("Lien expiré ou invalide.")}`);
    }
    return NextResponse.redirect(`${origin}${next}`);
  }

  // Aucun paramètre exploitable.
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("Lien invalide.")}`);
}
