"use server";

import { revalidatePath } from "next/cache";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/db";
import { classLabel } from "@/lib/classes";

const norm = (s: string) =>
  (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function callerSchoolId(): Promise<string | null> {
  const session = createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return null;
  const { data: staff } = await session
    .from("school_staff")
    .select("school_id")
    .eq("user_id", user.id)
    .eq("role", "school_admin")
    .maybeSingle();
  return staff?.school_id ?? null;
}

export type PendingStudent = {
  id: string;
  fullName: string;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  sex: string | null;
  birthDate: string | null;
  className: string | null;
  option: string | null;
  address: string | null;
  parentName: string;
  parentEmail: string;
  parentPhone: string | null;
  parentRelation: string | null;
  createdAt: string;
  // Doublon possible : un élève ACTIF du même nom existe déjà dans l'école.
  possibleDuplicate: { id: string; label: string } | null;
};

export async function getPendingStudents(): Promise<PendingStudent[]> {
  if (!isLiveMode()) return [];
  const schoolId = await callerSchoolId();
  if (!schoolId) return [];
  const svc = service();
  const { data: students } = await svc
    .from("students")
    .select("id, full_name, first_name, middle_name, last_name, sex, birth_date, class_name, option, address, created_at, created_by")
    .eq("school_id", schoolId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (!students || students.length === 0) return [];

  const parentIds = [...new Set(students.map((s: any) => s.created_by).filter(Boolean))];
  const { data: parents } = parentIds.length
    ? await svc.from("profiles").select("id, full_name, email, phone").in("id", parentIds)
    : { data: [] as any[] };
  const pmap = new Map((parents ?? []).map((p: any) => [p.id, p]));

  // Relation du parent demandeur (père / mère / tuteur…) issue de parent_links.
  const studentIds = students.map((s: any) => s.id);
  const { data: links } = studentIds.length
    ? await svc.from("parent_links").select("student_id, parent_id, relation, is_primary").in("student_id", studentIds)
    : { data: [] as any[] };
  const relByStudent = new Map<string, string>();
  for (const l of (links ?? []) as any[]) {
    // Priorité au lien du parent qui a créé la demande, sinon au lien primaire.
    const st = students.find((s: any) => s.id === l.student_id);
    if (st && (l.parent_id === st.created_by || (l.is_primary && !relByStudent.has(l.student_id)))) {
      if (l.relation) relByStudent.set(l.student_id, l.relation);
    }
  }

  // Élèves actifs de l'école → index par nom normalisé (détection de doublon).
  const { data: active } = await svc
    .from("students")
    .select("id, full_name, class_name, option")
    .eq("school_id", schoolId)
    .eq("status", "active");
  const byName = new Map<string, { id: string; label: string }>();
  for (const a of (active ?? []) as any[]) {
    const key = norm(a.full_name);
    if (key && !byName.has(key)) byName.set(key, { id: a.id, label: classLabel(a.class_name, a.option) });
  }

  return students.map((s: any) => {
    const p = pmap.get(s.created_by);
    const dup = byName.get(norm(s.full_name)) ?? null;
    return {
      id: s.id,
      fullName: s.full_name,
      firstName: s.first_name ?? null,
      middleName: s.middle_name ?? null,
      lastName: s.last_name ?? null,
      sex: s.sex,
      birthDate: s.birth_date,
      className: s.class_name,
      option: s.option ?? null,
      address: s.address ?? null,
      parentName: p?.full_name ?? "—",
      parentEmail: p?.email ?? "",
      parentPhone: p?.phone ?? null,
      parentRelation: relByStudent.get(s.id) ?? null,
      createdAt: new Date(s.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }),
      possibleDuplicate: dup,
    };
  });
}

// Rattache la demande à un dossier élève existant : déplace le(s) lien(s)
// parent vers l'élève existant puis supprime la fiche en doublon.
export async function attachToExisting(pendingStudentId: string, existingStudentId: string): Promise<{ ok: boolean; message?: string }> {
  if (!pendingStudentId || !existingStudentId) return { ok: false, message: "Paramètres invalides." };
  if (!isLiveMode()) return { ok: true };
  const schoolId = await callerSchoolId();
  if (!schoolId) return { ok: false, message: "Réservé à la direction." };

  const svc = service();
  const cols = "id, full_name, first_name, middle_name, last_name, sex, birth_date, class_name, grade_level, option, address, avatar_url";
  const { data: pend } = await svc.from("students").select(cols).eq("id", pendingStudentId).eq("school_id", schoolId).eq("status", "pending").maybeSingle();
  const { data: exist } = await svc.from("students").select(cols).eq("id", existingStudentId).eq("school_id", schoolId).maybeSingle();
  if (!pend || !exist) return { ok: false, message: "Élève introuvable." };

  // ── Fusion : LES DONNÉES DE L'ÉCOLE SONT PRINCIPALES. On ne remplace jamais
  //    une valeur déjà saisie par l'école par celle du parent ; on se contente
  //    de COMBLER les champs que l'école avait laissés vides avec ce que le
  //    parent a fourni. Aucune perte d'information → une seule fiche, l'école
  //    reste la source de vérité.
  const FIELDS = ["full_name", "first_name", "middle_name", "last_name", "sex", "birth_date", "class_name", "grade_level", "option", "address", "avatar_url"] as const;
  const merged: Record<string, any> = {};
  const isEmpty = (v: any) => v === null || v === undefined || String(v).trim() === "";
  for (const f of FIELDS) {
    const ev = (exist as any)[f]; // valeur école (prioritaire)
    const pv = (pend as any)[f];  // valeur parent (comble seulement les trous)
    if (isEmpty(ev) && !isEmpty(pv)) merged[f] = pv;
  }
  // grade_level est NOT NULL : s'assurer qu'il reste cohérent avec la classe.
  if (!merged.grade_level && merged.class_name) merged.grade_level = merged.class_name;
  if (Object.keys(merged).length > 0) {
    await svc.from("students").update(merged).eq("id", existingStudentId).eq("school_id", schoolId);
  }

  // Déplace les liens parent de la fiche en double vers la fiche existante.
  const { data: links } = await svc.from("parent_links").select("parent_id, relation").eq("student_id", pendingStudentId);
  const movedParents: string[] = [];
  for (const l of (links ?? []) as any[]) {
    const { data: already } = await svc.from("parent_links").select("student_id").eq("parent_id", l.parent_id).eq("student_id", existingStudentId).maybeSingle();
    if (!already) {
      await svc.from("parent_links").insert({
        parent_id: l.parent_id,
        student_id: existingStudentId,
        relation: l.relation ?? "parent",
        is_primary: false,
        access_status: "active",
      });
    }
    movedParents.push(l.parent_id);
  }
  await svc.from("parent_links").delete().eq("student_id", pendingStudentId);
  await svc.from("students").delete().eq("id", pendingStudentId).eq("school_id", schoolId);

  // Notifie le(s) parent(s) que la demande a été acceptée (rattachement).
  const name = (exist as any).full_name ?? merged.full_name ?? "l'élève";
  const uniqParents = [...new Set(movedParents.filter(Boolean))];
  if (uniqParents.length > 0) {
    await svc.from("notifications").insert(
      uniqParents.map((pid) => ({ user_id: pid, kind: "school" as const, body: `✅ Demande acceptée : ${name} a été ajouté(e) à l'école` }))
    );
  }

  revalidatePath("/school/requests");
  revalidatePath("/school/students");
  return { ok: true };
}

export async function setStudentValidation(studentId: string, approve: boolean, reason?: string): Promise<{ ok: boolean; message?: string }> {
  if (!studentId) return { ok: false, message: "Élève invalide." };
  if (!isLiveMode()) return { ok: true };
  const schoolId = await callerSchoolId();
  if (!schoolId) return { ok: false, message: "Réservé à la direction." };

  const svc = service();
  const { data: st } = await svc.from("students").select("id, full_name, created_by").eq("id", studentId).eq("school_id", schoolId).maybeSingle();
  if (!st) return { ok: false, message: "Élève introuvable." };

  const { error } = await svc.from("students").update({ status: approve ? "active" : "rejected" }).eq("id", studentId);
  if (error) return { ok: false, message: "Échec de la mise à jour." };

  // Notifie le parent qui a soumis la demande (→ push via send-push).
  if ((st as any).created_by) {
    const name = (st as any).full_name ?? "l'élève";
    const motif = reason?.trim();
    await svc.from("notifications").insert({
      user_id: (st as any).created_by,
      kind: "school",
      body: approve
        ? `✅ Demande acceptée : ${name} a été ajouté(e) à l'école`
        : `❌ Demande d'ajout refusée : ${name}${motif ? ` — motif : ${motif}` : ""}`,
    });
  }

  revalidatePath("/school/requests");
  revalidatePath("/school/students");
  return { ok: true };
}
