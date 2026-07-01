// POST /api/parent/register-child
// Le parent (app mobile) enregistre un enfant → crée un élève "pending" +
// le lien parent↔élève. L'école validera ensuite. Auth via le token Supabase
// du parent (en-tête Authorization: Bearer <access_token>).

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SR = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  try {
    const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
    if (!token) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

    // Vérifie le token et identifie le parent.
    const supa = createClient(URL, ANON, { auth: { persistSession: false } });
    const { data: { user } } = await supa.auth.getUser(token);
    if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

    const body = (await req.json().catch(() => ({}))) as {
      schoolId?: string; firstName?: string; middleName?: string; lastName?: string;
      sex?: string; birthDate?: string; className?: string; option?: string; address?: string;
    };
    const schoolId = String(body.schoolId ?? "").trim();
    const firstName = String(body.firstName ?? "").trim();
    const middleName = String(body.middleName ?? "").trim();
    const lastName = String(body.lastName ?? "").trim();
    const sex = body.sex === "M" || body.sex === "F" ? body.sex : null;
    const birthDate = String(body.birthDate ?? "").trim() || null;
    const className = String(body.className ?? "").trim() || null;
    const option = String(body.option ?? "").trim() || null;
    const address = String(body.address ?? "").trim() || null;

    if (!schoolId || !firstName || !lastName) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    const svc = createClient(URL, SR, { auth: { autoRefreshToken: false, persistSession: false } });

    // Garantit qu'un profil parent existe. Au signup l'upsert du profil est
    // "best-effort" (échec silencieux possible) ; sans ligne profiles, les
    // clés étrangères students.created_by et parent_links.parent_id cassent
    // → l'insertion échoue et le parent voit "Échec de l'envoi".
    const meta = (user.user_metadata ?? {}) as { full_name?: string; phone?: string };
    const { error: profErr } = await svc.from("profiles").upsert(
      {
        id: user.id,
        email: user.email ?? `${user.id}@parent.ekelasi`,
        full_name: meta.full_name?.trim() || user.email?.split("@")[0] || "Parent",
        role: "parent",
        phone: meta.phone ?? null,
      },
      { onConflict: "id", ignoreDuplicates: true }
    );
    if (profErr) console.error("[register-child] profile upsert:", profErr.message);

    // L'école existe ?
    const { data: school } = await svc.from("schools").select("id").eq("id", schoolId).maybeSingle();
    if (!school) return NextResponse.json({ error: "school_not_found" }, { status: 404 });

    // Nom complet (système congolais : NOM Post-nom Prénom).
    const fullName = [lastName, middleName, firstName].filter(Boolean).join(" ");

    // Note : la détection de doublon (élève du même nom déjà saisi par l'école)
    // est traitée à la VALIDATION côté école (menu Demandes), qui propose de
    // « rattacher au dossier existant » plutôt que de dupliquer.
    const { data: student, error: stErr } = await svc
      .from("students")
      .insert({
        school_id: schoolId,
        full_name: fullName,
        first_name: firstName,
        middle_name: middleName || null,
        last_name: lastName,
        sex,
        birth_date: birthDate,
        class_name: className,
        grade_level: className ?? "—",
        option,
        address,
        status: "pending",
        created_by: user.id,
      })
      .select("id")
      .single();
    if (stErr || !student) return NextResponse.json({ error: "create_failed" }, { status: 500 });

    const { error: linkErr } = await svc.from("parent_links").insert({
      parent_id: user.id,
      student_id: student.id,
      relation: "parent",
      is_primary: true,
      access_status: "active",
    });
    if (linkErr) {
      await svc.from("students").delete().eq("id", student.id);
      return NextResponse.json({ error: "link_failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, studentId: student.id });
  } catch (e: any) {
    console.error("[register-child]", e?.message ?? e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
