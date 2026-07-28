"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/env";

export type JournalEntry = {
  id: string;
  date: string;        // yyyy-mm-dd
  dateFr: string;      // jj/mm/aaaa
  subject: string;
  className: string;
  lesson: string;
  summary: string;
};

function fmtFr(d: string) {
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// Liste les entrées du journal du prof connecté, de la plus récente à la plus ancienne.
export async function listJournalEntries(): Promise<JournalEntry[]> {
  if (!isLiveMode()) return [];
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await (supabase as any)
      .from("teacher_journal")
      .select("id, entry_date, subject, class_name, lesson, summary")
      .eq("teacher_id", user.id)
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false });
    return (data ?? []).map((r: any) => ({
      id: r.id,
      date: typeof r.entry_date === "string" ? r.entry_date.slice(0, 10) : String(r.entry_date),
      dateFr: fmtFr(r.entry_date),
      subject: r.subject ?? "",
      className: r.class_name ?? "",
      lesson: r.lesson ?? "",
      summary: r.summary ?? "",
    }));
  } catch {
    return [];
  }
}

export async function addJournalEntry(args: {
  entryDate: string;
  subject?: string;
  className?: string;
  lesson: string;
  summary?: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const entryDate = (args.entryDate ?? "").trim();
  const lesson = (args.lesson ?? "").trim();
  if (!entryDate) return { ok: false, message: "La date est obligatoire." };
  if (!lesson) return { ok: false, message: "La leçon est obligatoire." };
  if (!isLiveMode()) return { ok: true };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Non authentifié." };
  const { data: staff } = await supabase
    .from("school_staff")
    .select("school_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const { error } = await (supabase as any).from("teacher_journal").insert({
    teacher_id: user.id,
    school_id: staff?.school_id ?? null,
    entry_date: entryDate,
    subject: (args.subject ?? "").trim() || null,
    class_name: (args.className ?? "").trim() || null,
    lesson,
    summary: (args.summary ?? "").trim() || null,
  });
  if (error) return { ok: false, message: "Enregistrement impossible." };
  revalidatePath("/teacher/journal");
  return { ok: true };
}

export async function deleteJournalEntry(id: string): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!isLiveMode()) return { ok: true };
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Non authentifié." };
  const { error } = await (supabase as any)
    .from("teacher_journal")
    .delete()
    .eq("id", id)
    .eq("teacher_id", user.id);
  if (error) return { ok: false, message: "Suppression impossible." };
  revalidatePath("/teacher/journal");
  return { ok: true };
}
