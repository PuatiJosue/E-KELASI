import { PageHeader } from "@/components/KPI";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/db";
import { YearArchiveForm } from "./YearArchiveForm";

function defaultCutoff(): string {
  // Par défaut, propose le 1er septembre de l'année scolaire en cours.
  // Si on est en juillet/août, on prend l'année courante.
  const now = new Date();
  const y = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  return `${y}-09-01`;
}

async function fetchCounts() {
  if (!isLiveMode()) return { grades: 0, homework: 0 };
  try {
    const supabase = createClient();
    const [{ count: g }, { count: h }] = await Promise.all([
      supabase.from("grades").select("*", { count: "exact", head: true }).is("archived_at", null),
      supabase.from("homework").select("*", { count: "exact", head: true }).is("archived_at", null),
    ]);
    return { grades: g ?? 0, homework: h ?? 0 };
  } catch {
    return { grades: 0, homework: 0 };
  }
}

export default async function YearArchivePage() {
  const counts = await fetchCounts();
  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title={{ fr: "Archive annuelle", en: "Year archive" }}
        sub={{
          fr: "À la rentrée, masque les notes et devoirs de l'année précédente pour redonner une interface vierge aux parents et profs.",
          en: "At the start of the school year, hide last year's grades and homework so parents and teachers get a clean slate.",
        }}
      />
      <YearArchiveForm
        defaultCutoff={defaultCutoff()}
        activeGrades={counts.grades}
        activeHomework={counts.homework}
      />
    </div>
  );
}
