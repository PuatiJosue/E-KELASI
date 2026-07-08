"use server";

import { revalidatePath } from "next/cache";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/db";
import { getStudentFinanceDetail, type StudentFinanceDetail } from "@/lib/finance-db";

type Result = { ok: true } | { ok: false; message: string };

// Charge le détail financier d'un élève (panneau bas du tableau de bord).
export async function loadStudentFinance(studentId: string): Promise<StudentFinanceDetail | null> {
  if (!studentId) return null;
  return getStudentFinanceDetail(studentId);
}

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

export async function recordStudentPayment(input: {
  studentId: string;
  amount: number;
  currency: string;
  label?: string;
  comment?: string;
  receiptUrl?: string;
  paidAt?: string;
}): Promise<Result> {
  if (!input.studentId) return { ok: false, message: "Élève invalide." };
  if (!(input.amount > 0)) return { ok: false, message: "Montant invalide." };
  if (!isLiveMode()) return { ok: true };

  const session = createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return { ok: false, message: "Non authentifié." };
  const schoolId = await callerSchoolId();
  if (!schoolId) return { ok: false, message: "Action réservée à la direction." };

  const svc = service();
  const { data: st } = await svc
    .from("students")
    .select("id")
    .eq("id", input.studentId)
    .eq("school_id", schoolId)
    .maybeSingle();
  if (!st) return { ok: false, message: "Élève introuvable." };

  const row: Record<string, any> = {
    school_id: schoolId,
    student_id: input.studentId,
    amount: input.amount,
    currency: input.currency || "USD",
    label: input.label?.trim() || null,
    comment: input.comment?.trim() || null,
    receipt_url: input.receiptUrl || null,
    recorded_by: user.id,
  };
  if (input.paidAt) row.paid_at = input.paidAt;

  const { error } = await svc.from("student_fee_payments").insert(row);
  if (error) return { ok: false, message: "Enregistrement impossible." };

  revalidatePath(`/school/students/${input.studentId}`);
  revalidatePath("/school/finances");
  return { ok: true };
}

// ── Rubriques de frais ───────────────────────────────────────────────
export async function createFeeCategory(input: { name: string; amount: number; currency?: string }): Promise<Result> {
  const name = input.name?.trim();
  if (!name) return { ok: false, message: "Nom de la rubrique requis." };
  if (!isLiveMode()) return { ok: true };
  const schoolId = await callerSchoolId();
  if (!schoolId) return { ok: false, message: "Réservé à la direction." };
  const svc = service();
  const { count } = await svc.from("fee_categories").select("id", { count: "exact", head: true }).eq("school_id", schoolId);
  const { error } = await (svc.from("fee_categories").insert as any)({
    school_id: schoolId, name, amount: input.amount || 0, currency: input.currency || "CDF", position: count ?? 0,
  });
  if (error) return { ok: false, message: "Création impossible." };
  revalidatePath("/school/finances");
  return { ok: true };
}

export async function updateFeeCategory(input: { id: string; name: string; amount: number; currency?: string }): Promise<Result> {
  if (!input.id) return { ok: false, message: "Rubrique invalide." };
  if (!isLiveMode()) return { ok: true };
  const schoolId = await callerSchoolId();
  if (!schoolId) return { ok: false, message: "Réservé à la direction." };
  const svc = service();
  const { error } = await (svc.from("fee_categories").update as any)({
    name: input.name?.trim() || "Rubrique", amount: input.amount || 0, currency: input.currency || "CDF",
  }).eq("id", input.id).eq("school_id", schoolId);
  if (error) return { ok: false, message: "Mise à jour impossible." };
  revalidatePath("/school/finances");
  return { ok: true };
}

export async function deleteFeeCategory(id: string): Promise<Result> {
  if (!id) return { ok: false, message: "Rubrique invalide." };
  if (!isLiveMode()) return { ok: true };
  const schoolId = await callerSchoolId();
  if (!schoolId) return { ok: false, message: "Réservé à la direction." };
  const svc = service();
  const { error } = await svc.from("fee_categories").delete().eq("id", id).eq("school_id", schoolId);
  if (error) return { ok: false, message: "Suppression impossible." };
  revalidatePath("/school/finances");
  return { ok: true };
}

// Applique une rubrique (montant par défaut) aux élèves : toute l'école ou une classe.
export async function applyCategoryToStudents(input: { categoryId: string; scope: "all" | "class"; className?: string }): Promise<Result> {
  if (!input.categoryId) return { ok: false, message: "Rubrique invalide." };
  if (!isLiveMode()) return { ok: true };
  const schoolId = await callerSchoolId();
  if (!schoolId) return { ok: false, message: "Réservé à la direction." };
  const svc = service();

  const { data: cat } = await svc.from("fee_categories").select("id, name, amount, currency").eq("id", input.categoryId).eq("school_id", schoolId).maybeSingle();
  if (!cat) return { ok: false, message: "Rubrique introuvable." };

  let q = svc.from("students").select("id, class_name").eq("school_id", schoolId).eq("status", "active");
  if (input.scope === "class" && input.className) q = q.eq("class_name", input.className);
  const { data: students } = await q;
  if (!students || students.length === 0) return { ok: false, message: "Aucun élève ciblé." };

  // Évite les doublons : élèves ayant déjà cette rubrique.
  const { data: existing } = await svc.from("student_fees").select("student_id").eq("school_id", schoolId).eq("category_id", input.categoryId);
  const has = new Set((existing ?? []).map((e: any) => e.student_id));

  const rows = students
    .filter((s: any) => !has.has(s.id))
    .map((s: any) => ({
      school_id: schoolId, student_id: s.id, category_id: (cat as any).id,
      label: (cat as any).name, amount_due: (cat as any).amount, currency: (cat as any).currency,
    }));
  if (rows.length === 0) return { ok: true };
  const { error } = await (svc.from("student_fees").insert as any)(rows);
  if (error) return { ok: false, message: "Application impossible." };
  revalidatePath("/school/finances");
  return { ok: true };
}

// Ajoute / met à jour une ligne de frais pour un élève (saisie manuelle).
export async function upsertStudentFee(input: { id?: string; studentId: string; categoryId?: string | null; label: string; amountDue: number; currency?: string }): Promise<Result> {
  if (!input.studentId) return { ok: false, message: "Élève invalide." };
  if (!isLiveMode()) return { ok: true };
  const schoolId = await callerSchoolId();
  if (!schoolId) return { ok: false, message: "Réservé à la direction." };
  const svc = service();
  const payload = {
    school_id: schoolId, student_id: input.studentId, category_id: input.categoryId ?? null,
    label: input.label?.trim() || "Frais", amount_due: input.amountDue || 0, currency: input.currency || "CDF",
  };
  const { error } = input.id
    ? await (svc.from("student_fees").update as any)(payload).eq("id", input.id).eq("school_id", schoolId)
    : await (svc.from("student_fees").insert as any)(payload);
  if (error) return { ok: false, message: "Enregistrement impossible." };
  revalidatePath("/school/finances");
  return { ok: true };
}

export async function deleteStudentFee(id: string): Promise<Result> {
  if (!id) return { ok: false, message: "Ligne invalide." };
  if (!isLiveMode()) return { ok: true };
  const schoolId = await callerSchoolId();
  if (!schoolId) return { ok: false, message: "Réservé à la direction." };
  const svc = service();
  const { error } = await svc.from("student_fees").delete().eq("id", id).eq("school_id", schoolId);
  if (error) return { ok: false, message: "Suppression impossible." };
  revalidatePath("/school/finances");
  return { ok: true };
}

// ── Avances & Acomptes ───────────────────────────────────────────────
export async function addAdvance(input: { studentId: string; categoryId?: string | null; amount: number; currency?: string; note?: string }): Promise<Result> {
  if (!input.studentId) return { ok: false, message: "Élève invalide." };
  if (!(input.amount > 0)) return { ok: false, message: "Montant invalide." };
  if (!isLiveMode()) return { ok: true };
  const schoolId = await callerSchoolId();
  if (!schoolId) return { ok: false, message: "Réservé à la direction." };
  const svc = service();
  const { error } = await (svc.from("student_advances").insert as any)({
    school_id: schoolId, student_id: input.studentId, category_id: input.categoryId ?? null,
    amount: input.amount, currency: input.currency || "CDF", note: input.note?.trim() || null,
  });
  if (error) return { ok: false, message: "Enregistrement impossible." };
  revalidatePath("/school/finances");
  return { ok: true };
}

export async function deleteAdvance(id: string): Promise<Result> {
  if (!id) return { ok: false, message: "Avance invalide." };
  if (!isLiveMode()) return { ok: true };
  const schoolId = await callerSchoolId();
  if (!schoolId) return { ok: false, message: "Réservé à la direction." };
  const svc = service();
  const { error } = await svc.from("student_advances").delete().eq("id", id).eq("school_id", schoolId);
  if (error) return { ok: false, message: "Suppression impossible." };
  revalidatePath("/school/finances");
  return { ok: true };
}

// ── Tranches & Échéances ─────────────────────────────────────────────
export async function addInstallment(input: { studentId: string; categoryId?: string | null; label: string; amount: number; currency?: string; dueDate?: string }): Promise<Result> {
  if (!input.studentId) return { ok: false, message: "Élève invalide." };
  if (!(input.amount > 0)) return { ok: false, message: "Montant invalide." };
  if (!isLiveMode()) return { ok: true };
  const schoolId = await callerSchoolId();
  if (!schoolId) return { ok: false, message: "Réservé à la direction." };
  const svc = service();
  const { error } = await (svc.from("student_installments").insert as any)({
    school_id: schoolId, student_id: input.studentId, category_id: input.categoryId ?? null,
    label: input.label?.trim() || "Tranche", amount: input.amount, currency: input.currency || "CDF",
    due_date: input.dueDate?.trim() || null,
  });
  if (error) return { ok: false, message: "Enregistrement impossible." };
  revalidatePath("/school/finances");
  return { ok: true };
}

export async function toggleInstallmentPaid(id: string, paid: boolean): Promise<Result> {
  if (!id) return { ok: false, message: "Tranche invalide." };
  if (!isLiveMode()) return { ok: true };
  const schoolId = await callerSchoolId();
  if (!schoolId) return { ok: false, message: "Réservé à la direction." };
  const svc = service();
  const { error } = await (svc.from("student_installments").update as any)({
    paid_at: paid ? new Date().toISOString().slice(0, 10) : null,
  }).eq("id", id).eq("school_id", schoolId);
  if (error) return { ok: false, message: "Mise à jour impossible." };
  revalidatePath("/school/finances");
  return { ok: true };
}

export async function deleteInstallment(id: string): Promise<Result> {
  if (!id) return { ok: false, message: "Tranche invalide." };
  if (!isLiveMode()) return { ok: true };
  const schoolId = await callerSchoolId();
  if (!schoolId) return { ok: false, message: "Réservé à la direction." };
  const svc = service();
  const { error } = await svc.from("student_installments").delete().eq("id", id).eq("school_id", schoolId);
  if (error) return { ok: false, message: "Suppression impossible." };
  revalidatePath("/school/finances");
  return { ok: true };
}

// Statut financier (En ordre / Non payé / Avance / Insolvable).
export async function setStudentFinanceStatus(studentId: string, status: "en_ordre" | "non_paye" | "avance" | "insolvable"): Promise<Result> {
  if (!studentId) return { ok: false, message: "Élève invalide." };
  if (!isLiveMode()) return { ok: true };
  const schoolId = await callerSchoolId();
  if (!schoolId) return { ok: false, message: "Réservé à la direction." };
  const svc = service();
  const { error } = await (svc.from("students").update as any)({ finance_status: status }).eq("id", studentId).eq("school_id", schoolId);
  if (error) return { ok: false, message: "Mise à jour impossible." };
  revalidatePath("/school/finances");
  return { ok: true };
}

// ── Facture (point 5) ────────────────────────────────────────────────
// Enregistre un paiement rangé dans la rubrique correspondant au type, en
// créant la rubrique si elle n'existe pas encore. Renvoie un aperçu pour le PDF.
export type InvoiceType = "acompte" | "tranche" | "autre";

// Trouve (ou crée) la rubrique cible pour un type de facture.
async function resolveCategory(
  svc: ReturnType<typeof service>,
  schoolId: string,
  type: InvoiceType,
  opts: { categoryName?: string; amount: number; currency: string }
): Promise<string | null> {
  const { data: cats } = await svc
    .from("fee_categories")
    .select("id, name, kind")
    .eq("school_id", schoolId);
  const list = (cats ?? []) as any[];

  const defaults: Record<InvoiceType, { name: string; kind: string }> = {
    acompte: { name: "Acompte", kind: "acompte" },
    tranche: { name: "Frais de scolarité", kind: "scolarite" },
    autre: { name: (opts.categoryName || "Autres frais").trim(), kind: "autre" },
  };
  const target = defaults[type];

  // Correspondance : par kind pour acompte/tranche, par nom pour « autre ».
  const found = type === "autre"
    ? list.find((c) => (c.name ?? "").trim().toLowerCase() === target.name.toLowerCase())
    : list.find((c) => c.kind === target.kind) ?? list.find((c) => (c.name ?? "").toLowerCase().includes(type === "tranche" ? "scolar" : "acompte"));
  if (found) return found.id;

  const { count } = await svc.from("fee_categories").select("id", { count: "exact", head: true }).eq("school_id", schoolId);
  const { data: inserted, error } = await (svc.from("fee_categories").insert as any)({
    school_id: schoolId, name: target.name, kind: target.kind, amount: opts.amount || 0, currency: opts.currency || "CDF", position: count ?? 0,
  }).select("id").single();
  if (error || !inserted) return null;
  return (inserted as any).id;
}

export async function createInvoice(input: {
  studentId: string;
  type: InvoiceType;
  label: string;
  categoryName?: string;   // requis si type === "autre"
  trancheLabel?: string;   // requis si type === "tranche"
  amount: number;
  currency: string;
  date?: string;
}): Promise<Result> {
  if (!input.studentId) return { ok: false, message: "Élève requis." };
  if (!(input.amount > 0)) return { ok: false, message: "Montant invalide." };
  if (input.type === "autre" && !input.categoryName?.trim()) return { ok: false, message: "Nom de la rubrique requis." };
  if (!isLiveMode()) return { ok: true };

  const session = createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return { ok: false, message: "Non authentifié." };
  const schoolId = await callerSchoolId();
  if (!schoolId) return { ok: false, message: "Réservé à la direction." };

  const svc = service();
  const { data: st } = await svc.from("students").select("id").eq("id", input.studentId).eq("school_id", schoolId).maybeSingle();
  if (!st) return { ok: false, message: "Élève introuvable." };

  const currency = input.currency || "CDF";
  const categoryId = await resolveCategory(svc, schoolId, input.type, { categoryName: input.categoryName, amount: input.amount, currency });
  if (!categoryId) return { ok: false, message: "Rubrique impossible à créer." };

  const date = input.date?.trim() || new Date().toISOString().slice(0, 10);
  const label = input.label?.trim() || null;

  let error: any = null;
  if (input.type === "acompte") {
    ({ error } = await (svc.from("student_advances").insert as any)({
      school_id: schoolId, student_id: input.studentId, category_id: categoryId,
      amount: input.amount, currency, note: label,
    }));
  } else if (input.type === "tranche") {
    ({ error } = await (svc.from("student_installments").insert as any)({
      school_id: schoolId, student_id: input.studentId, category_id: categoryId,
      label: input.trancheLabel?.trim() || label || "Tranche", amount: input.amount, currency,
      due_date: date, paid_at: date,
    }));
  } else {
    ({ error } = await (svc.from("student_fee_payments").insert as any)({
      school_id: schoolId, student_id: input.studentId, category_id: categoryId,
      amount: input.amount, currency, label, paid_at: date, recorded_by: user.id,
    }));
  }
  if (error) return { ok: false, message: "Enregistrement impossible." };

  revalidatePath("/school/finances");
  revalidatePath(`/school/students/${input.studentId}`);
  return { ok: true };
}

// ── Caisse : dépenses & recettes (point 7) ───────────────────────────
export async function addCashEntry(input: {
  kind: "depense" | "recette";
  amount: number;
  currency?: string;
  label: string;
  entryDate?: string;
  signatory?: string;
  note?: string;
}): Promise<Result> {
  if (input.kind !== "depense" && input.kind !== "recette") return { ok: false, message: "Type invalide." };
  if (!(input.amount > 0)) return { ok: false, message: "Montant invalide." };
  if (!input.label?.trim()) return { ok: false, message: "Libellé requis." };
  if (!isLiveMode()) return { ok: true };
  const session = createClient();
  const { data: { user } } = await session.auth.getUser();
  const schoolId = await callerSchoolId();
  if (!schoolId) return { ok: false, message: "Réservé à la direction." };
  const svc = service();
  const { error } = await (svc.from("cash_entries").insert as any)({
    school_id: schoolId, kind: input.kind, amount: input.amount, currency: input.currency || "CDF",
    label: input.label.trim(), entry_date: input.entryDate?.trim() || new Date().toISOString().slice(0, 10),
    signatory: input.signatory?.trim() || null, note: input.note?.trim() || null, recorded_by: user?.id ?? null,
  });
  if (error) return { ok: false, message: "Enregistrement impossible." };
  revalidatePath("/school/finances");
  return { ok: true };
}

export async function deleteCashEntry(id: string): Promise<Result> {
  if (!id) return { ok: false, message: "Écriture invalide." };
  if (!isLiveMode()) return { ok: true };
  const schoolId = await callerSchoolId();
  if (!schoolId) return { ok: false, message: "Réservé à la direction." };
  const svc = service();
  const { error } = await svc.from("cash_entries").delete().eq("id", id).eq("school_id", schoolId);
  if (error) return { ok: false, message: "Suppression impossible." };
  revalidatePath("/school/finances");
  return { ok: true };
}

export async function deleteStudentPayment(id: string, studentId: string): Promise<Result> {
  if (!id) return { ok: false, message: "Paiement invalide." };
  if (!isLiveMode()) return { ok: true };
  const schoolId = await callerSchoolId();
  if (!schoolId) return { ok: false, message: "Action réservée à la direction." };

  const svc = service();
  const { error } = await svc
    .from("student_fee_payments")
    .delete()
    .eq("id", id)
    .eq("school_id", schoolId);
  if (error) return { ok: false, message: "Suppression impossible." };

  revalidatePath(`/school/students/${studentId}`);
  revalidatePath("/school/finances");
  return { ok: true };
}
