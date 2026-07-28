import { serviceClient } from "@/lib/supabase/service";

export async function feePaymentCount(svc: ReturnType<typeof serviceClient>, schoolId: string, feeId: string): Promise<number> {
  const { count } = await svc
    .from("fee_payments")
    .select("id", { count: "exact", head: true })
    .eq("school_id", schoolId).eq("fee_id", feeId).is("cancelled_at", null);
  return count ?? 0;
}

