// Reçu imprimable d'un paiement de frais. Lecture via le client service :
// le scope école est garanti par getMySchool + filtre school_id.

import { serviceClient } from "@/lib/supabase/service";
import { getMySchool } from "@/lib/school/profile";
import { isLiveMode } from "@/lib/env";

export async function getPaymentForReceipt(paymentId: string) {
  if (!isLiveMode()) return null;
  try {
    const school = await getMySchool();
    if (!school) return null;
    const svc = serviceClient();
    const { data } = await svc
      .from("student_fee_payments")
      .select("id, amount, currency, label, comment, paid_at, created_at, students(full_name, class_name), profiles:recorded_by(full_name)")
      .eq("school_id", school.id)
      .eq("id", paymentId)
      .maybeSingle();
    if (!data) return null;
    const p: any = data;
    return {
      id: p.id,
      amount: Number(p.amount),
      currency: p.currency as string,
      label: p.label as string | null,
      comment: p.comment as string | null,
      paidAt: p.paid_at as string,
      recordedBy: p.profiles?.full_name ?? null,
      studentName: p.students?.full_name ?? "—",
      className: p.students?.class_name ?? null,
      school: {
        name: school.name,
        city: school.city ?? "",
        commune: (school as any).commune ?? "",
        logoUrl: school.logoUrl ?? null,
        signatureUrl: school.signatureUrl ?? null,
        directorName: school.directorName ?? null,
      },
    };
  } catch {
    return null;
  }
}
