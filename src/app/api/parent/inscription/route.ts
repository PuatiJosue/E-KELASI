// POST /api/parent/inscription
// Le parent (app) envoie un dossier d'inscription complet pour un NOUVEL élève.
// Auth via le token Supabase du parent. Crée une ligne inscriptions (pending).

import { NextRequest, NextResponse } from "next/server";
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
    const schoolId = String(b.schoolId ?? "").trim();
    const studentData = b.studentData ?? {};
    if (!schoolId || !studentData.firstName || !studentData.lastName) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    const svc = createClient(URL, SR, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: school } = await svc.from("schools").select("id").eq("id", schoolId).maybeSingle();
    if (!school) return NextResponse.json({ error: "school_not_found" }, { status: 404 });

    const { error } = await svc.from("inscriptions").insert({
      school_id: schoolId,
      student_data: studentData,
      parent_data: b.parentData ?? {},
      photo_student_url: b.photoStudentUrl || null,
      photo_parent_url: b.photoParentUrl || null,
      documents_url: b.documentsUrl || null,
      school_year: String(b.schoolYear ?? "").trim() || null,
      requested_class: String(b.requestedClass ?? "").trim() || null,
      option: String(b.option ?? "").trim() || null,
      status: "pending",
      created_by: user.id,
    });
    if (error) return NextResponse.json({ error: "create_failed" }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[inscription]", e?.message ?? e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
