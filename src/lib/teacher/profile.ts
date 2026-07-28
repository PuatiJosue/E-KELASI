// Profil du professeur connecté, son école et ses matières.

import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/env";

export type TeacherProfile = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
};

export type TeacherSchool = {
  id: string;
  name: string;
  city: string;
  totalStudents: number;
};

export type TeacherSubject = {
  id: string;
  name: string;
  shortName: string;
  color: string;
};

export async function getTeacherProfile(): Promise<TeacherProfile | null> {
  if (!isLiveMode()) {
    return { id: "demo-teacher", name: "M. Ousmane Bâ", email: "ousmane.ba@ekelasi.demo", avatarUrl: null };
  }
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("full_name, email, avatar_url")
    .eq("id", user.id)
    .maybeSingle();
  if (!data) return null;
  return { id: user.id, name: data.full_name, email: data.email, avatarUrl: data.avatar_url };
}

// Statut de l'école du prof (pour bloquer l'accès si l'abonnement est impayé).
export async function getTeacherSchoolStatus(): Promise<string | null> {
  if (!isLiveMode()) return "active";
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: staff } = await supabase
      .from("school_staff")
      .select("schools(status)")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();
    return (staff as any)?.schools?.status ?? null;
  } catch {
    return null;
  }
}

export async function getTeacherSchool(): Promise<TeacherSchool | null> {
  if (!isLiveMode()) {
    return { id: "demo", name: "Lycée Albert-Camus", city: "Dakar", totalStudents: 28 };
  }
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: staff } = await supabase
      .from("school_staff")
      .select("school_id, schools(name, city)")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();
    if (!staff) return null;
    const { count } = await supabase
      .from("students")
      .select("*", { count: "exact", head: true })
      .eq("school_id", staff.school_id)
      .eq("status", "active");
    return {
      id: staff.school_id,
      name: (staff as any).schools?.name ?? "",
      city: (staff as any).schools?.city ?? "",
      totalStudents: count ?? 0,
    };
  } catch {
    return null;
  }
}

export async function listTeacherSubjects(): Promise<TeacherSubject[]> {
  if (!isLiveMode()) return [];
  try {
    const supabase = createClient();
    const school = await getTeacherSchool();
    if (!school) return [];
    const { data } = await supabase
      .from("subjects")
      .select("id, name, short_name, color")
      .eq("school_id", school.id);
    return (data ?? []).map((s: any) => ({
      id: s.id,
      name: s.name,
      shortName: s.short_name,
      color: s.color,
    }));
  } catch {
    return [];
  }
}
