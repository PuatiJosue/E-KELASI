"use server";

import { revalidatePath } from "next/cache";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { classLabel } from "@/lib/classes";
import { isLiveMode } from "@/lib/db";
import {
  getArchiveClasses, getArchiveStudents, getStudentArchive,
  type ArchivePayload, type ArchiveClass, type ArchiveStudentLite, type StudentArchive,
} from "@/lib/year-archive-db";

// Wrappers server-action pour la consultation des archives (Option 1) côté client.
export async function loadArchiveClasses(year: string): Promise<ArchiveClass[]> {
  return getArchiveClasses(year);
}
export async function loadArchiveStudents(year: string, className: string): Promise<ArchiveStudentLite[]> {
  return getArchiveStudents(year, className);
}
export async function loadStudentArchive(id: string): Promise<StudentArchive | null> {
  return getStudentArchive(id);
}

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function caller(): Promise<{ userId: string; schoolId: string } | null> {
  const session = createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return null;
  const { data: staff } = await session
    .from("school_staff")
    .select("school_id")
    .eq("user_id", user.id)
    .eq("role", "school_admin")
    .maybeSingle();
  if (!staff?.school_id) return null;
  return { userId: user.id, schoolId: staff.school_id };
}

// ── Option 1 — Archiver l'année (instantané durable, classé par classe) ──
export async function archiveYearSnapshot(
  schoolYear: string
): Promise<{ ok: true; count: number } | { ok: false; message: string }> {
  const year = (schoolYear ?? "").trim();
  if (!year) return { ok: false, message: "Indiquez l'année scolaire à archiver." };
  if (!isLiveMode()) return { ok: true, count: 0 };

  const c = await caller();
  if (!c) return { ok: false, message: "Réservé à la direction." };
  const svc = service();

  const { data: students } = await svc
    .from("students")
    .select("id, full_name, matricule, sex, class_name, option, status, birth_date, birth_place, father_name, mother_name, guardian_name, guardian_phone, enrolled_at")
    .eq("school_id", c.schoolId)
    .eq("status", "active");
  const list = (students ?? []) as any[];
  if (list.length === 0) return { ok: false, message: "Aucun élève actif à archiver." };
  const ids = list.map((s) => s.id);

  const [{ data: links }, { data: fees }, { data: pays }, { data: advs }, { data: insts }, { data: bulls }, { data: atts }, { data: reens }] =
    await Promise.all([
      svc.from("parent_links").select("student_id, is_primary, profiles!parent_links_parent_id_fkey(full_name, phone)").in("student_id", ids),
      svc.from("student_fees").select("student_id, amount_due, currency").eq("school_id", c.schoolId),
      svc.from("student_fee_payments").select("student_id, amount").eq("school_id", c.schoolId),
      svc.from("student_advances").select("student_id, amount").eq("school_id", c.schoolId),
      svc.from("student_installments").select("student_id, amount, paid_at").eq("school_id", c.schoolId),
      svc.from("bulletin_drafts").select("student_id, trimester, rows, place, mention, total_obtenu, total_max, percentage").in("student_id", ids),
      svc.from("student_attendance").select("student_id, status").eq("school_id", c.schoolId),
      svc.from("reenrollments").select("student_id, mode, status, school_year").eq("school_id", c.schoolId).eq("status", "validated"),
    ]);

  // Parent principal.
  const parentBy = new Map<string, { name: string; phone: string | null }>();
  for (const l of (links ?? []) as any[]) {
    if (!parentBy.has(l.student_id) || l.is_primary) parentBy.set(l.student_id, { name: l.profiles?.full_name ?? "—", phone: l.profiles?.phone ?? null });
  }
  // Finances.
  const dueBy = new Map<string, number>(); const paidBy = new Map<string, number>(); let currency = "CDF";
  for (const f of (fees ?? []) as any[]) { dueBy.set(f.student_id, (dueBy.get(f.student_id) ?? 0) + Number(f.amount_due)); if (f.currency) currency = f.currency; }
  for (const p of (pays ?? []) as any[]) paidBy.set(p.student_id, (paidBy.get(p.student_id) ?? 0) + Number(p.amount));
  for (const a of (advs ?? []) as any[]) paidBy.set(a.student_id, (paidBy.get(a.student_id) ?? 0) + Number(a.amount));
  for (const it of (insts ?? []) as any[]) if (it.paid_at) paidBy.set(it.student_id, (paidBy.get(it.student_id) ?? 0) + Number(it.amount));
  // Bulletins.
  const bullBy = new Map<string, any[]>();
  for (const b of (bulls ?? []) as any[]) {
    if (!bullBy.has(b.student_id)) bullBy.set(b.student_id, []);
    bullBy.get(b.student_id)!.push({
      trimester: b.trimester, place: b.place ?? "", mention: b.mention ?? "",
      totalObtenu: b.total_obtenu != null ? String(b.total_obtenu) : "", totalMax: b.total_max != null ? String(b.total_max) : "",
      percentage: b.percentage != null ? String(b.percentage) : "", rows: Array.isArray(b.rows) ? b.rows : [],
    });
  }
  // Présences.
  const attBy = new Map<string, { present: number; absent: number; late: number; justified: number }>();
  for (const a of (atts ?? []) as any[]) {
    const e = attBy.get(a.student_id) ?? { present: 0, absent: 0, late: 0, justified: 0 };
    if (a.status === "present") e.present++; else if (a.status === "absent") e.absent++; else if (a.status === "late") e.late++; else if (a.status === "justified") e.justified++;
    attBy.set(a.student_id, e);
  }
  // Décision passe/redouble.
  const decBy = new Map<string, "promotion" | "redoublant">();
  for (const r of (reens ?? []) as any[]) if (r.mode === "promotion" || r.mode === "redoublant") decBy.set(r.student_id, r.mode);

  const rows = list.map((s) => {
    const totalDue = dueBy.get(s.id) ?? 0;
    const paid = paidBy.get(s.id) ?? 0;
    const att = attBy.get(s.id) ?? { present: 0, absent: 0, late: 0, justified: 0 };
    const recorded = att.present + att.absent + att.late + att.justified;
    const className = classLabel(s.class_name, s.option);
    const payload: ArchivePayload = {
      identity: {
        fullName: s.full_name, matricule: s.matricule ?? null, sex: s.sex ?? null, className,
        birthDate: s.birth_date ?? null, birthPlace: s.birth_place ?? null,
        fatherName: s.father_name ?? null, motherName: s.mother_name ?? null,
        guardianName: s.guardian_name ?? null, guardianPhone: s.guardian_phone ?? null, enrolledAt: s.enrolled_at ?? null,
      },
      parent: parentBy.get(s.id) ?? null,
      finance: { currency, totalDue, paid, remaining: Math.max(0, totalDue - paid) },
      bulletins: (bullBy.get(s.id) ?? []).sort((a: any, b: any) => a.trimester - b.trimester),
      attendance: { ...att, recorded, rate: recorded > 0 ? Math.round((att.present / recorded) * 100) : null },
      decision: s.status === "graduated" ? "graduated" : decBy.get(s.id) ?? null,
    };
    return {
      school_id: c.schoolId, student_id: s.id, school_year: year,
      class_name: className, full_name: s.full_name, payload,
    };
  });

  const { error } = await (svc.from("student_year_archives").upsert as any)(rows, { onConflict: "school_id,student_id,school_year" });
  if (error) return { ok: false, message: "Archivage impossible." };

  revalidatePath("/school/year-archive");
  return { ok: true, count: rows.length };
}

// ── Option 2 — Démarrer une nouvelle année (vider les compteurs) ─────────
type Result =
  | { ok: true; gradesArchived: number; homeworkArchived: number }
  | { ok: false; message: string };

export async function archiveSchoolYearAction(args: { confirm: string }): Promise<Result> {
  if ((args.confirm ?? "").trim().toUpperCase() !== "ARCHIVER") {
    return { ok: false, message: 'Tape "ARCHIVER" pour confirmer.' };
  }
  if (!isLiveMode()) return { ok: true, gradesArchived: 0, homeworkArchived: 0 };

  const c = await caller();
  if (!c) return { ok: false, message: "Réservé à la direction." };

  const svc = service();

  // Garde-fou : exiger d'avoir archivé l'année (Option 1) d'abord.
  const { count: archived } = await svc
    .from("student_year_archives")
    .select("id", { count: "exact", head: true })
    .eq("school_id", c.schoolId);
  if (!archived || archived === 0) {
    return { ok: false, message: "Archivez d'abord l'année (Option 1) avant de démarrer la nouvelle année." };
  }

  // 1) Notes & devoirs → archivés (non supprimés) via le RPC scopé école.
  const session = createClient();
  const { data, error } = await (session.rpc as any)("archive_school_year", { p_school_id: c.schoolId });
  if (error) {
    console.warn("[school-year-archive] rpc error:", error.message);
    return { ok: false, message: "Archivage refusé (droits insuffisants ?)." };
  }
  const row = Array.isArray(data) ? data[0] : data;
  const gradesArchived = (row as any)?.grades_count ?? 0;
  const homeworkArchived = (row as any)?.homework_count ?? 0;

  // 2) Remise à zéro (les données sont conservées dans l'archive Option 1).
  await Promise.all([
    svc.from("student_attendance").delete().eq("school_id", c.schoolId),
    svc.from("staff_attendance").delete().eq("school_id", c.schoolId),
    svc.from("bulletin_drafts").delete().eq("school_id", c.schoolId),
    svc.from("student_fee_payments").delete().eq("school_id", c.schoolId),
    svc.from("student_advances").delete().eq("school_id", c.schoolId),
    svc.from("student_installments").delete().eq("school_id", c.schoolId),
    svc.from("student_fees").delete().eq("school_id", c.schoolId),
    svc.from("cash_entries").delete().eq("school_id", c.schoolId),
  ]);

  revalidatePath("/school/year-archive");
  revalidatePath("/school/overview");
  revalidatePath("/school/reports");
  revalidatePath("/school/finances");
  return { ok: true, gradesArchived, homeworkArchived };
}
