"use server";

import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getMySchool } from "@/lib/school-db";
import { isLiveMode } from "@/lib/db";
import { classLabel } from "@/lib/classes";
import type { SearchResult } from "@/components/SearchBox";

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function searchSchool(q: string): Promise<SearchResult[]> {
  if (!isLiveMode() || q.trim().length < 2) return [];
  try {
    const school = await getMySchool();
    if (!school) return [];
    const svc = service();
    const query = q.trim();

    // Élèves par nom.
    const { data: studs } = await svc
      .from("students")
      .select("id, full_name, class_name, option")
      .eq("school_id", school.id)
      .ilike("full_name", `%${query}%`)
      .limit(8);
    const students: SearchResult[] = (studs ?? []).map((s: any) => ({
      id: s.id,
      kind: "student",
      label: s.full_name,
      sub: classLabel(s.class_name, s.option),
      href: `/school/students/${s.id}`,
    }));

    // Classes correspondantes (dérivées des élèves).
    const { data: all } = await svc.from("students").select("class_name, option").eq("school_id", school.id);
    const ql = query.toLowerCase();
    const seen = new Set<string>();
    const classes: SearchResult[] = [];
    for (const c of (all ?? []) as any[]) {
      if (!c.class_name) continue;
      const label = classLabel(c.class_name, c.option);
      if (label.toLowerCase().includes(ql) && !seen.has(label)) {
        seen.add(label);
        classes.push({ id: label, kind: "class", label, sub: "Classe", href: "/school/students" });
      }
      if (classes.length >= 5) break;
    }

    return [...students, ...classes];
  } catch {
    return [];
  }
}
