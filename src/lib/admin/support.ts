// Tickets de support groupés par statut.

import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/env";
import { MOCK_TICKETS, type Ticket } from "@/lib/mock";

export async function listTicketsByStatus(): Promise<Record<string, Ticket[]>> {
  if (!isLiveMode()) return MOCK_TICKETS;
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("support_tickets")
      .select(
        "reference, title, tag, priority, status, profiles!support_tickets_reporter_id_fkey(full_name), schools(name)"
      )
      .order("created_at", { ascending: false });
    if (error || !data) return MOCK_TICKETS;

    const grouped: Record<string, Ticket[]> = { new: [], pending: [], waiting: [], resolved: [] };
    for (const t of data as any[]) {
      const list = grouped[t.status];
      if (!list) continue;
      list.push({
        id: t.reference,
        title: { fr: t.title, en: t.title },
        who: t.profiles?.full_name ?? t.schools?.name ?? "—",
        tag: t.tag,
        pri: t.priority,
      });
    }
    return grouped;
  } catch {
    return { new: [], pending: [], waiting: [], resolved: [] };
  }
}
