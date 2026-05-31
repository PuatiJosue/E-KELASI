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
  const next = searchParams.get("next") ?? "/overview";

  if (!token_hash || !type) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("Lien invalide.")}`);
  }

  const supabase = createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash });
  if (error) {
    console.warn("[auth/confirm] verifyOtp error:", error.message);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("Lien expiré ou invalide.")}`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
