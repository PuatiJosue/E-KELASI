"use server";

import { revalidatePath } from "next/cache";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/db";

type Result = { ok: true } | { ok: false; message: string };

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function caller(): Promise<{ userId: string; schoolId: string } | null> {
  const session = createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return null;
  const { data: staff } = await session
    .from("school_staff")
    .select("school_id")
    .eq("user_id", user.id)
    .eq("role", "school_admin")
    .maybeSingle();
  if (!staff?.school_id) return null;
  return { userId: user.id, schoolId: staff.school_id };
}

const VALID = ["present", "absent", "late", "justified"];

export async function setAttendance(staffId: string, date: string, status: string, comment?: string): Promise<Result> {
  if (!staffId || !date || !VALID.includes(status)) return { ok: false, message: "Données invalides." };
  if (!isLiveMode()) return { ok: true };
  const c = await caller();
  if (!c) return { ok: false, message: "Action réservée à la direction." };
  const svc = service();
  const { error } = await svc.from("staff_attendance").upsert(
    {
      school_id: c.schoolId,
      staff_id: staffId,
      date,
      status,
      comment: comment?.trim() || null,
      recorded_by: c.userId,
    },
    { onConflict: "school_id,staff_id,date" }
  );
  if (error) return { ok: false, message: "Enregistrement impossible." };
  revalidatePath("/school/attendance");
  return { ok: true };
}
