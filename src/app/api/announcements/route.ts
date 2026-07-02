// GET /api/announcements?school=<id>
// Annonces publiques d'une école — pour que le parent consulte les annonces de
// n'importe quelle école depuis « Contact école » (même sans enfant inscrit).
// Ne renvoie que les champs d'annonce (aucune donnée personnelle).

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function service() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function GET(req: NextRequest) {
  const schoolId = (req.nextUrl.searchParams.get("school") ?? "").trim();
  if (!schoolId) return NextResponse.json({ announcements: [] });
  try {
    const { data } = await service()
      .from("announcements")
      .select("id, title, body, event_date, created_at, attachment_url, attachment_name")
      .eq("school_id", schoolId)
      .order("created_at", { ascending: false })
      .limit(50);
    return NextResponse.json({ announcements: data ?? [] });
  } catch {
    return NextResponse.json({ announcements: [] });
  }
}
