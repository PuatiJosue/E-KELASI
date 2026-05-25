// Supabase Edge Function : send-push
// Scanne les notifications non-pushées, POST à l'Expo Push API, marque pushed_at.
//
// Invocation :
//   - Manuellement : supabase functions invoke send-push
//   - Périodique : configurer un cron Supabase / GitHub Action / pg_cron
//   - Trigger : appelée par un trigger DB après insert sur notifications
//
// L'app mobile enregistre son token Expo dans push_tokens (lib/push.ts côté RN).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type ExpoMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default";
  priority?: "default" | "normal" | "high";
  channelId?: string;
};

const KIND_TITLES: Record<string, string> = {
  grade: "Nouvelle note",
  message: "Nouveau message",
  hw: "Nouveau devoir",
  school: "École",
  reminder: "Rappel",
  billing: "Abonnement",
};

const KIND_SCREENS: Record<string, string> = {
  grade: "grades",
  message: "messages",
  hw: "homework",
  school: "notifications",
  reminder: "notifications",
  billing: "profile",
};

Deno.serve(async (_req: Request) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Fetch toutes les notifs non-pushées
  const { data: notifs, error: notifErr } = await supabase
    .from("notifications")
    .select("id, user_id, kind, body")
    .is("pushed_at", null)
    .order("created_at", { ascending: true })
    .limit(100);

  if (notifErr) {
    return new Response(JSON.stringify({ error: notifErr.message }), { status: 500 });
  }
  if (!notifs || notifs.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), { status: 200 });
  }

  // Récupère tous les tokens pour ces users en une seule query
  const userIds = [...new Set(notifs.map((n) => n.user_id))];
  const { data: tokens } = await supabase
    .from("push_tokens")
    .select("user_id, expo_token")
    .in("user_id", userIds);

  if (!tokens || tokens.length === 0) {
    // Marque comme pushed quand même pour ne pas re-scanner indéfiniment
    await supabase
      .from("notifications")
      .update({ pushed_at: new Date().toISOString() })
      .in("id", notifs.map((n) => n.id));
    return new Response(JSON.stringify({ sent: 0, reason: "no tokens" }), { status: 200 });
  }

  const tokensByUser = tokens.reduce<Record<string, string[]>>((acc, t) => {
    (acc[t.user_id] ||= []).push(t.expo_token);
    return acc;
  }, {});

  // Build Expo Push messages
  const messages: ExpoMessage[] = [];
  for (const n of notifs) {
    const userTokens = tokensByUser[n.user_id] ?? [];
    for (const tok of userTokens) {
      messages.push({
        to: tok,
        title: KIND_TITLES[n.kind] ?? "E-KELASI",
        body: n.body,
        data: { screen: KIND_SCREENS[n.kind] ?? "notifications", notificationId: n.id },
        sound: "default",
        priority: "high",
        channelId: "default",
      });
    }
  }

  if (messages.length === 0) {
    await supabase.from("notifications").update({ pushed_at: new Date().toISOString() }).in("id", notifs.map((n) => n.id));
    return new Response(JSON.stringify({ sent: 0 }), { status: 200 });
  }

  // Expo Push API accepte jusqu'à 100 messages par appel
  const res = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
    },
    body: JSON.stringify(messages),
  });

  const expoResp = await res.json();

  // Marque les notifs comme pushed
  await supabase
    .from("notifications")
    .update({ pushed_at: new Date().toISOString() })
    .in("id", notifs.map((n) => n.id));

  return new Response(
    JSON.stringify({ sent: messages.length, expo: expoResp }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});
