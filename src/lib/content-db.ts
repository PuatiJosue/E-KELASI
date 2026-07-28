// Lecture — emploi du temps + vidéos des cours (console école).
// Service role, scope école via getMySchool.

import { serviceClient } from "@/lib/supabase/service";
import { getMySchool } from "@/lib/school/profile";
import { isLiveMode } from "@/lib/env";

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
  color: string | null;
  published: boolean;
};

export async function listTimetable(): Promise<TimetableSlot[]> {
  if (!isLiveMode()) return [];
  try {
    const school = await getMySchool();
    if (!school) return [];
    const { data } = await serviceClient()
      .from("timetable_slots")
      .select("id, class_name, option, day, start_time, end_time, subject, teacher, room, color, published")
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
      color: s.color ?? null,
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
    const { data } = await serviceClient()
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

// Parents de l'école (pour cibler des destinataires précis d'une vidéo).
export type SchoolParent = { id: string; name: string; students: string };
export async function listSchoolParents(): Promise<SchoolParent[]> {
  if (!isLiveMode()) return [];
  try {
    const school = await getMySchool();
    if (!school) return [];
    const svc = serviceClient();
    const { data: students } = await svc
      .from("students")
      .select("id, full_name")
      .eq("school_id", school.id)
      .eq("status", "active");
    const ids = (students ?? []).map((s: any) => s.id);
    if (ids.length === 0) return [];
    const nameByStudent = new Map((students ?? []).map((s: any) => [s.id, s.full_name]));
    const { data: links } = await svc.from("parent_links").select("parent_id, student_id").in("student_id", ids);
    const studentsByParent = new Map<string, string[]>();
    for (const l of (links ?? []) as any[]) {
      if (!studentsByParent.has(l.parent_id)) studentsByParent.set(l.parent_id, []);
      studentsByParent.get(l.parent_id)!.push(nameByStudent.get(l.student_id) ?? "");
    }
    const parentIds = [...studentsByParent.keys()];
    if (parentIds.length === 0) return [];
    const { data: profs } = await svc.from("profiles").select("id, full_name").in("id", parentIds);
    const nameByParent = new Map((profs ?? []).map((p: any) => [p.id, p.full_name]));
    return parentIds
      .map((pid) => ({
        id: pid,
        name: nameByParent.get(pid) || "Parent",
        students: [...new Set(studentsByParent.get(pid) ?? [])].filter(Boolean).join(", "),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "fr"));
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
    const { data } = await serviceClient()
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
