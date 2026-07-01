// Lecture — emploi du temps + vidéos des cours (console école).
// Service role, scope école via getMySchool.

import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getMySchool } from "@/lib/school-db";
import { isLiveMode } from "@/lib/db";

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export type TimetableSlot = {
  id: string;
  className: string;
  option: string | null;
  day: number;
  startTime: string;
  endTime: string;
  subject: string;
  teacher: string | null;
  room: string | null;
  published: boolean;
};

export async function listTimetable(): Promise<TimetableSlot[]> {
  if (!isLiveMode()) return [];
  try {
    const school = await getMySchool();
    if (!school) return [];
    const { data } = await service()
      .from("timetable_slots")
      .select("id, class_name, option, day, start_time, end_time, subject, teacher, room, published")
      .eq("school_id", school.id)
      .order("class_name")
      .order("day")
      .order("start_time");
    return (data ?? []).map((s: any) => ({
      id: s.id,
      className: s.class_name,
      option: s.option ?? null,
      day: s.day,
      startTime: s.start_time,
      endTime: s.end_time,
      subject: s.subject,
      teacher: s.teacher ?? null,
      room: s.room ?? null,
      published: !!s.published,
    }));
  } catch {
    return [];
  }
}

export type CourseVideo = {
  id: string;
  className: string | null;
  subject: string | null;
  title: string;
  url: string;
  description: string | null;
  createdAt: string;
};

export async function listCourseVideos(): Promise<CourseVideo[]> {
  if (!isLiveMode()) return [];
  try {
    const school = await getMySchool();
    if (!school) return [];
    const { data } = await service()
      .from("course_videos")
      .select("id, class_name, subject, title, url, description, created_at")
      .eq("school_id", school.id)
      .order("created_at", { ascending: false });
    return (data ?? []).map((v: any) => ({
      id: v.id,
      className: v.class_name ?? null,
      subject: v.subject ?? null,
      title: v.title,
      url: v.url,
      description: v.description ?? null,
      createdAt: v.created_at,
    }));
  } catch {
    return [];
  }
}

// Classes distinctes de l'école (pour les sélecteurs de saisie).
export async function listSchoolClassNames(): Promise<string[]> {
  if (!isLiveMode()) return [];
  try {
    const school = await getMySchool();
    if (!school) return [];
    const { data } = await service()
      .from("students")
      .select("class_name")
      .eq("school_id", school.id)
      .eq("status", "active");
    const set = new Set<string>();
    for (const r of (data ?? []) as any[]) if (r.class_name) set.add(r.class_name);
    return [...set].sort((a, b) => a.localeCompare(b, "fr", { numeric: true }));
  } catch {
    return [];
  }
}
