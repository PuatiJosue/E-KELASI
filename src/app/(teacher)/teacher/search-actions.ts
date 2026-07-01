"use server";

import { listTeacherClasses, listStudentsInClass } from "@/lib/teacher-db";
import type { SearchResult } from "@/components/SearchBox";

export async function searchTeacher(q: string): Promise<SearchResult[]> {
  const query = q.trim().toLowerCase();
  if (query.length < 2) return [];
  try {
    const classes = await listTeacherClasses();

    // Classes correspondantes.
    const classResults: SearchResult[] = classes
      .filter((c) => c.label.toLowerCase().includes(query))
      .slice(0, 5)
      .map((c) => ({
        id: c.key,
        kind: "class",
        label: c.label,
        sub: `${c.studentCount} élève${c.studentCount > 1 ? "s" : ""}`,
        href: `/teacher/classes/${encodeURIComponent(c.className)}?option=${encodeURIComponent(c.option ?? "")}`,
      }));

    // Élèves des classes du prof uniquement (chargées en parallèle).
    const perClass = await Promise.all(
      classes.map((c) =>
        listStudentsInClass(c.className, c.option)
          .then((sts) => sts.map((s) => ({ s, c })))
          .catch(() => [])
      )
    );
    const studentResults: SearchResult[] = perClass
      .flat()
      .filter(({ s }) => s.fullName.toLowerCase().includes(query))
      .slice(0, 8)
      .map(({ s, c }) => ({
        id: s.id,
        kind: "student",
        label: s.fullName,
        sub: c.label,
        href: `/teacher/classes/${encodeURIComponent(c.className)}?option=${encodeURIComponent(c.option ?? "")}`,
      }));

    // Élèves d'abord (plus précis), puis classes.
    return [...studentResults, ...classResults];
  } catch {
    return [];
  }
}
