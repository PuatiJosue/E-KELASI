"use server";

import { revalidatePath } from "next/cache";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/db";

export type AttendanceItem = { studentId: string; status: string };

type Result =
  | { ok: true; count: number }
  | { ok: false; message: string };

const VALID = ["present", "absent", "late", "justified"];

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function saveAttendanceAction(args: {
  date: string;
  items: AttendanceItem[];
}): Promise<Result> {
  if (!isLiveMode()) return { ok: true, count: args.items.length };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Non authentifié" };

  if (!args.date) return { ok: false, message: "Date manquante." };

  // École du prof.
  const { data: staff } = await supabase
    .from("school_staff")
    .select("school_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!staff?.school_id) return { ok: false, message: "Aucune école rattachée à ce compte." };

  const rows = args.items
    .filter((i) => i.studentId && VALID.includes(i.status))
    .map((i) => ({
      school_id: staff.school_id,
      student_id: i.studentId,
      date: args.date,
      status: i.status,
      recorded_by: user.id,
    }));
  if (rows.length === 0) return { ok: false, message: "Aucune présence à enregistrer." };

  const svc = service();
  const { error } = await svc
    .from("student_attendance")
    .upsert(rows, { onConflict: "student_id,date" });
  if (error) {
    console.warn("[saveAttendance] upsert error:", error.message);
    return { ok: false, message: "Enregistrement impossible." };
  }

  revalidatePath("/teacher/attendance");
  return { ok: true, count: rows.length };
}
