"use server";

import { listTeacherClasses } from "@/lib/teacher-db";
import type { SearchResult } from "@/components/SearchBox";

export async function searchTeacher(q: string): Promise<SearchResult[]> {
  const query = q.trim().toLowerCase();
  if (query.length < 2) return [];
  try {
    const classes = await listTeacherClasses();
    return classes
      .filter((c) => c.label.toLowerCase().includes(query))
      .slice(0, 8)
      .map((c) => ({
        id: c.key,
        kind: "class",
        label: c.label,
        sub: `${c.studentCount} élève${c.studentCount > 1 ? "s" : ""}`,
        href: `/teacher/classes/${encodeURIComponent(c.className)}?option=${encodeURIComponent(c.option ?? "")}`,
      }));
  } catch {
    return [];
  }
}
