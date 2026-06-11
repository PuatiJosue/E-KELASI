// GET /api/schools/search?q=...
// Recherche publique d'écoles par nom (pour que le parent choisisse l'école
// de son enfant depuis l'app mobile). Ne renvoie que des infos non sensibles.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function service() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ schools: [] });
  try {
    const { data } = await service()
      .from("schools")
      .select("id, name, city, commune, quartier")
      .ilike("name", `%${q}%`)
      .order("name")
      .limit(10);
    return NextResponse.json({ schools: data ?? [] });
  } catch {
    return NextResponse.json({ schools: [] });
  }
}
