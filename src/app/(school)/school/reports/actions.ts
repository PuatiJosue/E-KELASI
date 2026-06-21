"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/db";
import { getStudentReportData } from "@/lib/school-db";

type Result = { ok: true; code: string } | { ok: false; message: string };

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// Publie le bulletin d'un élève comme document officiel signé, visible des parents.
export async function publishBulletinAction(studentId: string, period: string, trimester?: number): Promise<Result> {
  if (!studentId) return { ok: false, message: "Élève invalide." };
  if (!isLiveMode()) return { ok: true, code: "DEMO1234" };

  const session = createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return { ok: false, message: "Non authentifié." };
  const { data: staff } = await session
    .from("school_staff")
    .select("school_id")
    .eq("user_id", user.id)
    .eq("role", "school_admin")
    .maybeSingle();
  if (!staff?.school_id) return { ok: false, message: "Réservé à la direction." };
  const schoolId = staff.school_id;

  const svc = service();

  // L'élève appartient bien à l'école + récupère la signature de l'école.
  const [{ data: student }, { data: school }] = await Promise.all([
    svc.from("students").select("id, full_name, class_name").eq("id", studentId).eq("school_id", schoolId).maybeSingle(),
    svc.from("schools").select("name, director_name, signature_url").eq("id", schoolId).maybeSingle(),
  ]);
  if (!student) return { ok: false, message: "Élève introuvable." };

  // Publie les notes du trimestre sélectionné (cohérent avec le bulletin affiché).
  const report = await getStudentReportData(studentId, trimester);
  if (!report) return { ok: false, message: "Aucune donnée de bulletin." };
  if (report.subjects.length === 0) {
    return { ok: false, message: "Aucune note pour ce trimestre — rien à publier." };
  }

  const code = randomBytes(5).toString("hex").toUpperCase(); // ex. 3F9A2C7B1D

  const data = {
    className: (student as any).class_name,
    overallAvg: report.overallAvg,
    subjects: report.subjects.map((s: any) => ({ name: s.name, avg: s.avg, count: s.items.length })),
  };

  const { error } = await svc.from("student_documents").insert({
    school_id: schoolId,
    student_id: studentId,
    type: "bulletin",
    title: "Bulletin scolaire",
    period: period || null,
    signed_by: (school as any)?.director_name ?? null,
    signature_url: (school as any)?.signature_url ?? null,
    verify_code: code,
    data,
    created_by: user.id,
  });
  if (error) return { ok: false, message: "Publication impossible." };

  // Notifie les parents de l'élève (best effort) — le bulletin apparaît
  // côté parent dans « Documents officiels » + notification/push.
  try {
    const { data: links } = await svc
      .from("parent_links")
      .select("parent_id")
      .eq("student_id", studentId);
    const parentIds = [...new Set((links ?? []).map((l: any) => l.parent_id))];
    if (parentIds.length > 0) {
      await svc.from("notifications").insert(
        parentIds.map((pid) => ({
          user_id: pid as string,
          kind: "school" as const,
          body: `📄 Bulletin disponible : ${(student as any).full_name}${period ? ` · ${period}` : ""}`,
        }))
      );
    }
  } catch {
    // notification best effort
  }

  revalidatePath(`/school/reports/${studentId}`);
  return { ok: true, code };
}
