// Rappel de paiement — parents des élèves ayant un reste à payer.
// Le reste à payer vient du module Finance v2 (fees + fee_payments + fee_overrides).

import { serviceClient } from "@/lib/supabase/service";
import { getMySchool } from "@/lib/school/profile";
import { classLabel, normOption } from "@/lib/classes";
import { isLiveMode } from "@/lib/env";

export type ReminderRecipient = {
  studentId: string;
  studentName: string;
  className: string;
  remaining: number;
  currency: string;
  parentId: string;
  parentName: string;
  parentPhone: string | null;
};

// Tous les élèves actifs ayant un parent joignable (pour la barre de sélection
// du rappel). Le reste à payer est joint : l'UI pré-coche les débiteurs.
export async function getReminderRecipients(): Promise<ReminderRecipient[]> {
  if (!isLiveMode()) return [];
  try {
    const school = await getMySchool();
    if (!school) return [];
    const svc = serviceClient();

    const [{ data: students }, { data: fees }] = await Promise.all([
      svc.from("students").select("id, full_name, class_name, option").eq("school_id", school.id).eq("status", "active"),
      svc.from("fees").select("id, class_name, option, total_amount, currency").eq("school_id", school.id).eq("archived", false),
    ]);
    const feeList = (fees ?? []) as any[];
    const feeIds = feeList.map((f) => f.id);
    const [{ data: overrides }, { data: pays }] = feeIds.length
      ? await Promise.all([
          svc.from("fee_overrides").select("fee_id, student_id, amount").in("fee_id", feeIds),
          svc.from("fee_payments").select("fee_id, student_id, amount").in("fee_id", feeIds).is("cancelled_at", null),
        ])
      : [{ data: [] as any[] }, { data: [] as any[] }];

    const ovr = new Map<string, number>();
    for (const o of (overrides ?? []) as any[]) ovr.set(`${o.fee_id}|${o.student_id}`, Number(o.amount));
    const paidBy = new Map<string, number>();
    for (const p of (pays ?? []) as any[]) paidBy.set(p.student_id, (paidBy.get(p.student_id) ?? 0) + Number(p.amount));

    const ids = (students ?? []).map((s: any) => s.id);
    const { data: links } = ids.length
      ? await svc.from("parent_links").select("student_id, parent_id, is_primary, profiles!parent_links_parent_id_fkey(full_name, phone)").in("student_id", ids)
      : { data: [] as any[] };

    // Parent principal (ou premier) par élève.
    const parentByStudent = new Map<string, { id: string; name: string; phone: string | null }>();
    for (const l of (links ?? []) as any[]) {
      if (!parentByStudent.has(l.student_id) || l.is_primary) {
        parentByStudent.set(l.student_id, { id: l.parent_id, name: l.profiles?.full_name ?? "Parent", phone: l.profiles?.phone ?? null });
      }
    }

    const currency = feeList[0]?.currency ?? "CDF";
    const out: ReminderRecipient[] = [];
    for (const s of (students ?? []) as any[]) {
      const p = parentByStudent.get(s.id);
      if (!p?.id) continue;
      let expected = 0;
      for (const f of feeList) {
        const applies = !f.class_name || (f.class_name === s.class_name && normOption(f.option) === normOption(s.option));
        if (applies) expected += ovr.has(`${f.id}|${s.id}`) ? ovr.get(`${f.id}|${s.id}`)! : Number(f.total_amount);
      }
      const remaining = Math.max(0, expected - (paidBy.get(s.id) ?? 0));
      out.push({
        studentId: s.id, studentName: s.full_name, className: classLabel(s.class_name, s.option),
        remaining, currency,
        parentId: p.id, parentName: p.name, parentPhone: p.phone,
      });
    }
    // Débiteurs d'abord, puis par classe / nom.
    out.sort((a, b) => (b.remaining > 0 ? 1 : 0) - (a.remaining > 0 ? 1 : 0) || a.className.localeCompare(b.className, "fr", { numeric: true }) || a.studentName.localeCompare(b.studentName));
    return out;
  } catch { return []; }
}
