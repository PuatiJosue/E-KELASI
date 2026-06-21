"use server";

import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/db";

export type BulletinRow = { branche: string; max: string; obtenu: string };
export type BulletinDraft = {
  rows: BulletinRow[];
  place: string;
  mention: string;
};

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// Vérifie que l'appelant (prof ou direction) appartient à l'école de l'élève.
// Renvoie { schoolId } si autorisé, sinon null.
async function authForStudent(studentId: string): Promise<{ schoolId: string; userId: string } | null> {
  const session = createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return null;
  const { data: staff } = await session
    .from("school_staff")
    .select("school_id, role")
    .eq("user_id", user.id)
    .in("role", ["teacher", "school_admin"]);
  const schoolIds = (staff ?? []).map((s: any) => s.school_id);
  if (schoolIds.length === 0) return null;
  const svc = service();
  const { data: student } = await svc
    .from("students")
    .select("school_id")
    .eq("id", studentId)
    .maybeSingle();
  const sid = (student as any)?.school_id;
  if (!sid || !schoolIds.includes(sid)) return null;
  return { schoolId: sid, userId: user.id };
}

function num(v: string): number {
  const n = parseFloat((v || "").replace(",", "."));
  return isNaN(n) ? 0 : n;
}

type SaveResult = { ok: true } | { ok: false; message: string };

// Enregistre (encode) le bulletin d'un élève pour un trimestre. Prof ou direction.
export async function saveBulletinDraft(input: {
  studentId: string;
  trimester: number;
  period: string;
  rows: BulletinRow[];
  place: string;
  mention: string;
}): Promise<SaveResult> {
  if (!isLiveMode()) return { ok: true };
  const auth = await authForStudent(input.studentId);
  if (!auth) return { ok: false, message: "Action non autorisée." };

  const rows = (input.rows ?? []).filter((r) => r.branche?.trim() || r.max?.trim() || r.obtenu?.trim());
  const totalMax = rows.reduce((a, r) => a + num(r.max), 0);
  const totalObtenu = rows.reduce((a, r) => a + num(r.obtenu), 0);
  const percentage = totalMax > 0 ? +((totalObtenu / totalMax) * 100).toFixed(2) : 0;

  const svc = service();
  const { error } = await svc.from("bulletin_drafts").upsert(
    {
      school_id: auth.schoolId,
      student_id: input.studentId,
      trimester: input.trimester,
      period: input.period || null,
      rows,
      place: input.place || null,
      mention: input.mention || null,
      total_max: totalMax,
      total_obtenu: totalObtenu,
      percentage,
      updated_by: auth.userId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "student_id,trimester" }
  );
  if (error) return { ok: false, message: "Enregistrement impossible." };
  return { ok: true };
}

// Charge le bulletin encodé d'un élève pour un trimestre (server-side).
export async function getBulletinDraft(studentId: string, trimester: number): Promise<BulletinDraft | null> {
  if (!isLiveMode()) return null;
  try {
    const svc = service();
    const { data } = await svc
      .from("bulletin_drafts")
      .select("rows, place, mention")
      .eq("student_id", studentId)
      .eq("trimester", trimester)
      .maybeSingle();
    if (!data) return null;
    const d: any = data;
    return {
      rows: Array.isArray(d.rows) ? d.rows : [],
      place: d.place ?? "",
      mention: d.mention ?? "",
    };
  } catch {
    return null;
  }
}
