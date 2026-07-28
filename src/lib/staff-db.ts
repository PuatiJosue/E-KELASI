// Couche données — fiches du personnel (Lot D1). Lecture via service role
// (table hors types générés ; scope école via getMySchool).

import { serviceClient } from "@/lib/supabase/service";
import { getMySchool } from "@/lib/school/profile";
import { isLiveMode } from "@/lib/env";
import type { StaffMember } from "@/lib/staff-types";

export type { StaffMember } from "@/lib/staff-types";

export async function listStaff(): Promise<StaffMember[]> {
  if (!isLiveMode()) return [];
  try {
    const school = await getMySchool();
    if (!school) return [];
    const svc = serviceClient();
    const { data } = await svc
      .from("staff_members")
      .select("id, full_name, last_name, middle_name, first_name, category, phone, email, qualifications, hire_date, status, photo_url, address, notes, linked_user_id")
      .eq("school_id", school.id)
      .order("full_name");
    return (data ?? []).map((s: any) => ({
      id: s.id,
      fullName: s.full_name,
      lastName: s.last_name ?? null,
      middleName: s.middle_name ?? null,
      firstName: s.first_name ?? null,
      category: s.category,
      phone: s.phone,
      email: s.email,
      qualifications: s.qualifications,
      hireDate: s.hire_date,
      status: s.status,
      photoUrl: s.photo_url,
      address: s.address,
      notes: s.notes,
      linkedUserId: s.linked_user_id ?? null,
    }));
  } catch {
    return [];
  }
}

// IDs des fiches ayant un code d'accès généré mais pas encore consommé.
export async function listPendingCodeStaffIds(): Promise<string[]> {
  if (!isLiveMode()) return [];
  try {
    const school = await getMySchool();
    if (!school) return [];
    const svc = serviceClient();
    const { data } = await svc
      .from("teacher_access_codes")
      .select("staff_id")
      .eq("school_id", school.id)
      .is("redeemed_at", null)
      .not("staff_id", "is", null);
    return [...new Set((data ?? []).map((r: any) => r.staff_id).filter(Boolean))];
  } catch {
    return [];
  }
}
