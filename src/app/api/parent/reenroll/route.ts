// POST /api/parent/reenroll
// Le parent (app mobile) envoie une demande de réinscription pour son enfant.
// Auth via le token Supabase du parent. Crée une ligne reenrollments (pending).

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

    const body = (await req.json().catch(() => ({}))) as {
      studentId?: string; schoolYear?: string; mode?: string;
      requestedClass?: string; option?: string; studentData?: any; parentData?: any;
    };
    const studentId = String(body.studentId ?? "").trim();
    const schoolYear = String(body.schoolYear ?? "").trim();
    const mode = body.mode === "redoublant" ? "redoublant" : "promotion";
    if (!studentId || !schoolYear) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

    const svc = createClient(URL, SR, { auth: { autoRefreshToken: false, persistSession: false } });

    // L'élève appartient bien à ce parent ?
    const { data: link } = await svc
      .from("parent_links")
      .select("student_id")
      .eq("parent_id", user.id)
      .eq("student_id", studentId)
      .maybeSingle();
    if (!link) return NextResponse.json({ error: "not_your_child" }, { status: 403 });

    const { data: student } = await svc.from("students").select("school_id").eq("id", studentId).maybeSingle();
    if (!student) return NextResponse.json({ error: "student_not_found" }, { status: 404 });

    const { error } = await svc.from("reenrollments").insert({
      school_id: (student as any).school_id,
      student_id: studentId,
      school_year: schoolYear,
      mode,
      requested_class: String(body.requestedClass ?? "").trim() || null,
      option: String(body.option ?? "").trim() || null,
      student_data: body.studentData ?? null,
      parent_data: body.parentData ?? null,
      status: "pending",
      created_by: user.id,
    });
    if (error) return NextResponse.json({ error: "create_failed" }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[reenroll]", e?.message ?? e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
