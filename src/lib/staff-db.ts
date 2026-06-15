// Couche données — fiches du personnel (Lot D1). Lecture via service role
// (table hors types générés ; scope école via getMySchool).

import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getMySchool } from "@/lib/school-db";
import { isLiveMode } from "@/lib/db";
import type { StaffMember } from "@/lib/staff-types";

export type { StaffMember } from "@/lib/staff-types";

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function listStaff(): Promise<StaffMember[]> {
  if (!isLiveMode()) return [];
  try {
    const school = await getMySchool();
    if (!school) return [];
    const svc = service();
    const { data } = await svc
      .from("staff_members")
      .select("id, full_name, category, phone, email, qualifications, hire_date, status, photo_url, address, notes")
      .eq("school_id", school.id)
      .order("full_name");
    return (data ?? []).map((s: any) => ({
      id: s.id,
      fullName: s.full_name,
      category: s.category,
      phone: s.phone,
      email: s.email,
      qualifications: s.qualifications,
      hireDate: s.hire_date,
      status: s.status,
      photoUrl: s.photo_url,
      address: s.address,
      notes: s.notes,
    }));
  } catch {
    return [];
  }
}
