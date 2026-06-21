"use server";

import { revalidatePath } from "next/cache";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/db";
import { resolveOrCreateSubjectId } from "@/lib/subjects-db";
import { formatDateFr } from "@/lib/grade-report";
import { renderNotePdf } from "@/lib/note-pdf";

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

  // ── Génération + envoi de la note en PDF (optionnel) ───────────────
  let pdfsSent = 0;
  if (args.sendPdf) {
    try {
      pdfsSent = await sendNotePdfs({
        schoolId: staff.school_id,
        subject: args.subjectName.trim(),
        kind: args.kind,
        maxScore: args.maxScore,
        coefficient: args.coefficient,
        gradedAt: args.gradedAt,
        items: args.items,
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

// ── Envoi de la note (évaluation) en PDF aux parents ──────────────────
async function sendNotePdfs(opts: {
  schoolId: string;
  subject: string;
  kind: string;
  maxScore: number;
  coefficient: number;
  gradedAt: string;
  items: GradeInput[];
}): Promise<number> {
  const admin = adminClient();

  // École (en-tête : nom + logo).
  const { data: school } = await admin
    .from("schools")
    .select("name, city, brand_color, logo_url")
    .eq("id", opts.schoolId)
    .maybeSingle();
  const sc: any = school ?? {};
  const dateFr = formatDateFr(opts.gradedAt);
  let sent = 0;

  for (const item of opts.items) {
    try {
      const { data: student } = await admin
        .from("students")
        .select("full_name, class_name")
        .eq("id", item.studentId)
        .maybeSingle();
      if (!student) continue;

      const pdf = await renderNotePdf({
        school: {
          name: sc.name ?? "École",
          city: sc.city ?? null,
          logoUrl: sc.logo_url ?? null,
          brandColor: sc.brand_color ?? null,
        },
        studentName: (student as any).full_name,
        className: (student as any).class_name ?? "—",
        subject: opts.subject,
        kind: opts.kind,
        score: item.score,
        max: opts.maxScore,
        coefficient: opts.coefficient,
        date: dateFr,
      });

      const path = `notes/${item.studentId}/${Date.now()}.pdf`;
      const { error: upErr } = await admin.storage
        .from("grade-reports")
        .upload(path, pdf, { contentType: "application/pdf", upsert: true });
      if (upErr) {
        console.warn("[note-pdf] upload error", item.studentId, upErr.message);
        continue;
      }

      const { data: signed, error: sErr } = await admin.storage
        .from("grade-reports")
        .createSignedUrl(path, 60 * 60 * 24 * 365);
      if (sErr || !signed?.signedUrl) {
        console.warn("[note-pdf] sign error", item.studentId, sErr?.message);
        continue;
      }

      const { data: links } = await admin
        .from("parent_links")
        .select("parent_id")
        .eq("student_id", item.studentId);
      if (links && links.length > 0) {
        await admin.from("notifications").insert(
          links.map((l: any) => ({
            user_id: l.parent_id,
            kind: "grade" as const,
            body: `📄 Note de ${(student as any).full_name} en ${opts.subject} : ${item.score}/${opts.maxScore} (PDF).`,
            payload: { file_url: signed.signedUrl, kind: "note_pdf" },
          }))
        );
      }
      sent += 1;
    } catch (e: any) {
      console.warn("[note-pdf] per-student error", item.studentId, e?.message ?? e);
    }
  }

  return sent;
}
