// Journal d'audit (console admin).

import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/env";
import { MOCK_LOGS, type LogEvent } from "@/lib/mock";

export async function listAuditLogs(limit = 50): Promise<LogEvent[]> {
  if (!isLiveMode()) return MOCK_LOGS;
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("audit_logs")
      .select("severity, actor, source, message, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error || !data) return MOCK_LOGS;
    return data.map((r) => ({
      sev: r.severity,
      actor: r.actor,
      src: r.source,
      msg: { fr: r.message, en: r.message },
      ts: new Date(r.created_at).toISOString().slice(11, 19),
    }));
  } catch {
    return [];
  }
}
