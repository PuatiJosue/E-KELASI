"use server";

import { revalidatePath } from "next/cache";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/db";

type Result = { ok: true } | { ok: false; message: string };

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
