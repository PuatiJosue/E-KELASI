"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { serviceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/env";
import { getStudentReportData } from "@/lib/school/dossier";
import { getBulletinDraft } from "@/lib/bulletin-actions";
import { renderBulletinPointsPdf } from "@/lib/bulletin-points-pdf";
import { currentTrimester } from "@/lib/trimester";

type Result = { ok: true; code: string } | { ok: false; message: string };

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

  const svc = serviceClient();
  const tri = trimester ?? currentTrimester();

  // L'élève appartient bien à l'école + identité de l'école (en-tête + signature).
  const [{ data: student }, { data: school }] = await Promise.all([
    svc.from("students").select("id, full_name, class_name").eq("id", studentId).eq("school_id", schoolId).maybeSingle(),
    svc.from("schools").select("name, city, logo_url, brand_color, director_name, signature_url").eq("id", schoolId).maybeSingle(),
  ]);
  if (!student) return { ok: false, message: "Élève introuvable." };

  // Bulletin encodé/enregistré ; à défaut, dérivé des cotes (Σ barèmes / Σ points).
  const draft = await getBulletinDraft(studentId, tri);
  let rows = draft?.rows ?? [];
  if (rows.length === 0) {
    const report = await getStudentReportData(studentId, tri);
    rows = (report?.subjects ?? []).map((s: any) => ({
      branche: s.name,
      max: String(s.items.reduce((a: number, it: any) => a + Number(it.max_score || 0), 0)),
      obtenu: String(s.items.reduce((a: number, it: any) => a + Number(it.score || 0), 0)),
    }));
  }
  if (rows.length === 0) {
    return { ok: false, message: "Aucune donnée — encodez ou saisissez des notes pour ce trimestre." };
  }

  const sc: any = school ?? {};
  const num = (v: string) => { const n = parseFloat((v || "").replace(",", ".")); return isNaN(n) ? 0 : n; };
  // Total/pourcentage saisis par le prof (prioritaires), sinon calcul auto.
  const autoMax = rows.reduce((a, r) => a + num(r.max), 0);
  const autoObtenu = rows.reduce((a, r) => a + num(r.obtenu), 0);
  const autoPct = autoMax > 0 ? +((autoObtenu / autoMax) * 100).toFixed(2) : 0;
  const totalMax = draft?.totalMax?.trim() ? num(draft.totalMax) : autoMax;
  const totalObtenu = draft?.totalObtenu?.trim() ? num(draft.totalObtenu) : autoObtenu;
  const percentage = draft?.percentage?.trim() ? num(draft.percentage) : autoPct;

  // Génère le PDF du bulletin (format points) → URL signée.
  let fileUrl: string | null = null;
  try {
    const pdf = await renderBulletinPointsPdf({
      school: {
        name: sc.name ?? "École",
        city: sc.city ?? null,
        logoUrl: sc.logo_url ?? null,
        brandColor: sc.brand_color ?? null,
        signatureUrl: sc.signature_url ?? null,
        directorName: sc.director_name ?? null,
      },
      student: { fullName: (student as any).full_name, className: (student as any).class_name ?? "—" },
      period,
      rows,
      place: draft?.place ?? "",
      mention: draft?.mention ?? "",
      totalObtenu: draft?.totalObtenu ?? "",
      totalMax: draft?.totalMax ?? "",
      percentage: draft?.percentage ?? "",
    });
    const path = `bulletins/${studentId}-t${tri}-${Date.now()}.pdf`;
    const { error: upErr } = await svc.storage.from("grade-reports").upload(path, pdf, { contentType: "application/pdf", upsert: true });
    if (!upErr) {
      const { data: signed } = await svc.storage.from("grade-reports").createSignedUrl(path, 60 * 60 * 24 * 365);
      fileUrl = signed?.signedUrl ?? null;
    }
  } catch {
    // PDF best effort
  }

  const code = randomBytes(5).toString("hex").toUpperCase();
  const data = {
    className: (student as any).class_name,
    totalMax, totalObtenu, percentage,
    place: draft?.place ?? "",
    mention: draft?.mention ?? "",
    rows,
    fileUrl,
  };

  const { error } = await svc.from("student_documents").insert({
    school_id: schoolId,
    student_id: studentId,
    type: "bulletin",
    title: "Bulletin scolaire",
    period: period || null,
    signed_by: sc.director_name ?? null,
    signature_url: sc.signature_url ?? null,
    verify_code: code,
    data,
    created_by: user.id,
  });
  if (error) return { ok: false, message: "Publication impossible." };

  // Notifie les parents (best effort) avec le PDF — apparaît côté parent.
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
          payload: fileUrl ? { file_url: fileUrl, kind: "bulletin_pdf" } : null,
        }))
      );
    }
  } catch {
    // notification best effort
  }

  revalidatePath(`/school/reports/${studentId}`);
  return { ok: true, code };
}
