"use server";

import { revalidatePath } from "next/cache";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isLiveMode } from "@/lib/db";

type Result = { ok: true; message: string } | { ok: false; message: string };

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function inviteTeacherAction(args: { email: string; fullName: string }): Promise<Result> {
  if (!args.email || !args.fullName) return { ok: false, message: "Nom et email requis." };
  if (!isLiveMode()) return { ok: true, message: `Invitation simulée envoyée à ${args.email}.` };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Non authentifié" };

  // Trouve l'école du school_admin connecté
  const { data: staff } = await supabase
    .from("school_staff")
    .select("school_id")
    .eq("user_id", user.id)
    .eq("role", "school_admin")
    .maybeSingle();
  if (!staff) return { ok: false, message: "Vous n'êtes pas direction d'une école." };

  // Création du user via service role (nécessite la clé service_role)
  const admin = service();
  const { data: created, error: createErr } = await admin.auth.admin.inviteUserByEmail(args.email, {
    data: { full_name: args.fullName },
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/login`,
  });

  // Si l'utilisateur existe déjà, on récupère son id
  let userId: string | undefined = created?.user?.id;
  if (createErr && !userId) {
    if (createErr.message.toLowerCase().includes("already") || createErr.message.toLowerCase().includes("exist")) {
      const { data: existing } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      const found = existing?.users?.find((u) => u.email?.toLowerCase() === args.email.toLowerCase());
      if (found) userId = found.id;
    } else {
      return { ok: false, message: createErr.message };
    }
  }

  if (!userId) return { ok: false, message: "Création utilisateur échouée." };

  // Profil
  await admin.from("profiles").upsert({
    id: userId,
    email: args.email,
    full_name: args.fullName,
    role: "teacher",
    locale: "fr",
  });

  // Lien school_staff
  const { error: staffErr } = await admin
    .from("school_staff")
    .upsert({ school_id: staff.school_id, user_id: userId, role: "teacher" }, { onConflict: "school_id,user_id" });
  if (staffErr) return { ok: false, message: staffErr.message };

  revalidatePath("/school/teachers");
  return { ok: true, message: `Invitation envoyée à ${args.email}.` };
}
