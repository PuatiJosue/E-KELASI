import { createClient } from "@/lib/supabase/server";

// Gardes d'autorisation côté serveur. À appeler AVANT tout accès via le client
// « service role » (`@/lib/supabase/service`), qui contourne la RLS.

export type SchoolAdminCaller = { userId: string; schoolId: string };

// Renvoie l'appelant s'il est direction d'une école, sinon null.
export async function requireSchoolAdmin(): Promise<SchoolAdminCaller | null> {
  const session = createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return null;
  const { data: staff } = await session
    .from("school_staff")
    .select("school_id")
    .eq("user_id", user.id)
    .eq("role", "school_admin")
    .maybeSingle();
  if (!staff?.school_id) return null;
  return { userId: user.id, schoolId: staff.school_id };
}

// Variante ne gardant que l'école, pour les appelants qui ignorent l'utilisateur.
export async function requireSchoolAdminId(): Promise<string | null> {
  return (await requireSchoolAdmin())?.schoolId ?? null;
}
