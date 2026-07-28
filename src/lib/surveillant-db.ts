// Couche données de l'espace surveillant.
//
// Le surveillant n'a accès qu'au pointage des présences des élèves de son école.
// Son école se résout via school_staff (role = 'surveillant'), et non via
// getMySchool() qui est réservé à la direction.

import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/env";

export type SurveillantContext = {
  userId: string;
  schoolId: string;
  schoolName: string;
  schoolStatus: string;
  name: string | null;
  avatarUrl: string | null;
};

export async function getSurveillantContext(): Promise<SurveillantContext | null> {
  if (!isLiveMode()) return null;
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: staff } = await supabase
      .from("school_staff")
      .select("school_id, schools(id, name, status)")
      .eq("user_id", user.id)
      .eq("role", "surveillant")
      .limit(1)
      .maybeSingle();
    const school = (staff as any)?.schools;
    if (!school) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    return {
      userId: user.id,
      schoolId: school.id,
      schoolName: school.name,
      schoolStatus: school.status,
      name: profile?.full_name ?? null,
      avatarUrl: (profile as any)?.avatar_url ?? null,
    };
  } catch {
    return null;
  }
}
