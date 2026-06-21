"use server";

import { revalidatePath } from "next/cache";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/db";
import { resolveOrCreateSubjectId } from "@/lib/subjects-db";
import {
  renderGradeReportPdf,
  schoolYearStartIso,
  computeSubjectAverage20,
  computeOverallAverage20,
  formatDateFr,
  type ReportData,
  type ReportSubject,
} from "@/lib/grade-report";

export type GradeInput = { studentId: string; score: number };

type SubmitArgs = {
  subjectName: string;
  kind: string;
  maxScore: number;
  coefficient: number;
  gradedAt: string;
  items: GradeInput[];
  sendPdf?: boolean;
};

type Result =
  | { ok: true; count: number; pdfsSent?: number }
  | { ok: false; message: string };

function adminClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function submitGradesAction(args: SubmitArgs): Promise<Result> {
  if (!isLiveMode()) return { ok: true, count: args.items.length };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Non authentifié" };

  if (args.items.length === 0) return { ok: false, message: "Aucune note à enregistrer" };

  if (!args.subjectName?.trim()) return { ok: false, message: "Indique une matière." };

  for (const it of args.items) {
    if (isNaN(it.score) || it.score < 0 || it.score > args.maxScore) {
      return { ok: false, message: `Note invalide (doit être entre 0 et ${args.maxScore})` };
    }
  }

  // École du prof (pour rattacher / créer la matière).
  const { data: staff } = await supabase
    .from("school_staff")
    .select("school_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!staff?.school_id) return { ok: false, message: "Aucune école rattachée à ce compte." };

  const subjectId = await resolveOrCreateSubjectId(staff.school_id, args.subjectName);
  if (!subjectId) return { ok: false, message: "Matière invalide." };

  const rows = args.items.map((it) => ({
    student_id: it.studentId,
    subject_id: subjectId,
    teacher_id: user.id,
    kind: args.kind,
    score: it.score,
    max_score: args.maxScore,
    coefficient: args.coefficient,
    graded_at: args.gradedAt,
  }));

  const { error } = await supabase.from("grades").insert(rows);
  if (error) {
    console.warn("[submitGrades] insert error:", error.message);
    return { ok: false, message: "Impossible d'enregistrer les notes." };
  }

  // Notifs simples (texte) — comportement existant, best-effort.
  try {
    const { data: links } = await supabase
      .from("parent_links")
      .select("parent_id, student_id, students(full_name)")
      .in("student_id", args.items.map((i) => i.studentId));

    const textNotifs = (links ?? [])
      .map((l: any) => {
        const item = args.items.find((i) => i.studentId === l.student_id);
        if (!item) return null;
        return {
          user_id: l.parent_id,
          kind: "grade" as const,
          body: `Nouvelle note pour ${l.students?.full_name ?? "votre enfant"} : ${item.score}/${args.maxScore} (${args.kind})`,
        };
      })
      .filter(Boolean);
    if (textNotifs.length > 0) {
      await supabase.from("notifications").insert(textNotifs as any[]);
    }
  } catch {
    // best-effort
  }

  // ── Génération + envoi du bulletin PDF (optionnel) ─────────────────
  let pdfsSent = 0;
  if (args.sendPdf) {
    try {
      pdfsSent = await sendReportPdfs({
        studentIds: [...new Set(args.items.map((i) => i.studentId))],
        teacherUserId: user.id,
      });
    } catch (e: any) {
      // L'échec du PDF ne doit pas faire échouer la saisie des notes.
      console.warn("[submitGrades] PDF dispatch error:", e?.message ?? e);
    }
  }

  revalidatePath("/teacher/grades");
  revalidatePath("/teacher/dashboard");
  return { ok: true, count: args.items.length, pdfsSent };
}

// ── PDF dispatch ──────────────────────────────────────────────────────
async function sendReportPdfs(opts: {
  studentIds: string[];
  teacherUserId: string;
}): Promise<number> {
  const admin = adminClient();

  // Nom du prof (pour l'en-tête du bulletin)
  const { data: teacher } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", opts.teacherUserId)
    .maybeSingle();
  const teacherName = teacher?.full_name ?? "Professeur";

  const yearStart = schoolYearStartIso();
  let sent = 0;

  for (const studentId of opts.studentIds) {
    try {
      // Élève + école
      const { data: student } = await admin
        .from("students")
        .select("id, full_name, class_name, school_id, schools(name, city, brand_color, logo_url)")
        .eq("id", studentId)
        .maybeSingle();
      if (!student) continue;
      const school = (student as any).schools;

      // Toutes les notes de l'année pour cet élève
      const { data: grades } = await admin
        .from("grades")
        .select("score, max_score, coefficient, graded_at, kind, subject_id, subjects(name)")
        .eq("student_id", studentId)
        .gte("graded_at", yearStart)
        .is("archived_at", null)
        .order("graded_at", { ascending: true });

      // Groupage par matière
      type SubjectAcc = { name: string; grades: any[] };
      const bySubject = new Map<string, SubjectAcc>();
      for (const g of (grades ?? []) as any[]) {
        const sid = g.subject_id as string;
        if (!bySubject.has(sid)) bySubject.set(sid, { name: g.subjects?.name ?? "—", grades: [] });
        bySubject.get(sid)!.grades.push(g);
      }

      const subjects: ReportSubject[] = [...bySubject.values()].map((s) => ({
        name: s.name,
        grades: s.grades.map((g) => ({
          date: formatDateFr(g.graded_at),
          kind: g.kind ?? "Évaluation",
          score: Number(g.score),
          max: Number(g.max_score),
          coefficient: Number(g.coefficient ?? 1),
        })),
        average20: computeSubjectAverage20(
          s.grades.map((g) => ({
            score: Number(g.score),
            max: Number(g.max_score),
            coefficient: Number(g.coefficient ?? 1),
          }))
        ),
      }));

      const data: ReportData = {
        school: {
          name: school?.name ?? "École",
          city: school?.city ?? "",
          brandColor: school?.brand_color ?? null,
          logoUrl: school?.logo_url ?? null,
        },
        student: {
          fullName: (student as any).full_name,
          className: (student as any).class_name ?? "—",
        },
        teacherName,
        asOf: formatDateFr(new Date()),
        subjects,
        overallAverage20: computeOverallAverage20(subjects.map((s) => s.average20)),
      };

      const pdf = await renderGradeReportPdf(data);
      const path = `${studentId}/${Date.now()}.pdf`;
      const { error: upErr } = await admin.storage
        .from("grade-reports")
        .upload(path, pdf, { contentType: "application/pdf", upsert: false });
      if (upErr) {
        console.warn("[pdf] upload error", studentId, upErr.message);
        continue;
      }

      // URL signée valable 30 jours
      const { data: signed, error: sErr } = await admin.storage
        .from("grade-reports")
        .createSignedUrl(path, 60 * 60 * 24 * 30);
      if (sErr || !signed?.signedUrl) {
        console.warn("[pdf] sign error", studentId, sErr?.message);
        continue;
      }

      // Notifie les parents avec le lien signé
      const { data: links } = await admin
        .from("parent_links")
        .select("parent_id")
        .eq("student_id", studentId);
      if (links && links.length > 0) {
        await admin.from("notifications").insert(
          links.map((l: any) => ({
            user_id: l.parent_id,
            kind: "grade" as const,
            body: `Bulletin de ${(student as any).full_name} disponible (PDF).`,
            payload: { file_url: signed.signedUrl, kind: "report_pdf" },
          }))
        );
      }
      sent += 1;
    } catch (e: any) {
      console.warn("[pdf] per-student error", studentId, e?.message ?? e);
    }
  }

  return sent;
}
