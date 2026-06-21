import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";

import { ScreenHeader } from "@/components/ScreenHeader";
import { Card } from "@/components/Card";
import { useTheme, fonts } from "@/lib/theme";
import { useT } from "@/lib/i18n";
import { registerForPushNotifications } from "@/lib/push";
import { supabase, isLiveMode } from "@/lib/supabase";

type Pref = "all" | "important" | "none";
const KEY = "ekelasi.notifPref";

const OPTIONS: { value: Pref; fr: string; en: string; descFr: string; descEn: string }[] = [
  { value: "all", fr: "Tout", en: "All", descFr: "Notes, devoirs, messages et annonces de l'école.", descEn: "Grades, homework, messages and school announcements." },
  { value: "important", fr: "Important", en: "Important", descFr: "Seulement les notes, annonces de l'école, rappels et abonnement.", descEn: "Only grades, school announcements, reminders and billing." },
  { value: "none", fr: "Aucune", en: "None", descFr: "Aucune notification push.", descEn: "No push notifications." },
];

export default function AccountNotifications() {
  const t = useTheme();
  const tr = useT();
  const [pref, setPref] = useState<Pref>("all");
  const [ready, setReady] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  // Charge la préférence : base si dispo, sinon cache local.
  useEffect(() => {
    (async () => {
      let value: Pref = "all";
      try {
        const cached = (await SecureStore.getItemAsync(KEY)) as Pref | null;
        if (cached === "all" || cached === "important" || cached === "none") value = cached;
      } catch {}
      if (isLiveMode && supabase) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data } = await supabase.from("profiles").select("notif_pref").eq("id", user.id).maybeSingle();
            const dbPref = (data as any)?.notif_pref as Pref | undefined;
            if (dbPref === "all" || dbPref === "important" || dbPref === "none") value = dbPref;
          }
        } catch {}
      }
      setPref(value);
      setReady(true);
    })();
  }, []);

  const choose = async (val: Pref) => {
    setPref(val);
    setNote(null);
    await SecureStore.setItemAsync(KEY, val).catch(() => {});

    // Persiste côté serveur (respecté par l'envoi des push).
    if (isLiveMode && supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) await supabase.from("profiles").update({ notif_pref: val }).eq("id", user.id);
      } catch {}
    }

    // Si on accepte des push, s'assure que l'appareil est bien enregistré.
    if (val !== "none") {
      const token = await registerForPushNotifications().catch(() => null);
      if (!token) {
        setNote(tr({
          fr: "Autorise les notifications dans les réglages du téléphone pour les recevoir.",
          en: "Allow notifications in your phone settings to receive them.",
        }));
      }
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={["top", "bottom"]}>
      <ScreenHeader title={tr({ fr: "Notifications", en: "Notifications" })} />
      <View style={{ padding: 20, gap: 12 }}>
        {!ready ? (
          <ActivityIndicator color={t.brand} style={{ marginTop: 30 }} />
        ) : (
          <>
            <Text style={{ fontSize: 12.5, color: t.ink3, fontFamily: fonts.body, lineHeight: 18, paddingHorizontal: 4 }}>
              {tr({ fr: "Choisis les notifications push que tu souhaites recevoir.", en: "Choose which push notifications you want to receive." })}
            </Text>
            <Card style={{ padding: 4 }}>
              {OPTIONS.map((o, i) => {
                const on = pref === o.value;
                return (
                  <Pressable
                    key={o.value}
                    onPress={() => choose(o.value)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      padding: 14,
                      borderBottomWidth: i < OPTIONS.length - 1 ? 1 : 0,
                      borderBottomColor: t.divider,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14.5, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold }}>
                        {tr({ fr: o.fr, en: o.en })}
                      </Text>
                      <Text style={{ fontSize: 12.5, color: t.ink3, marginTop: 2, fontFamily: fonts.body, lineHeight: 17 }}>
                        {tr({ fr: o.descFr, en: o.descEn })}
                      </Text>
                    </View>
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        borderWidth: 2,
                        borderColor: on ? t.brand : t.border,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {on && <View style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: t.brand }} />}
                    </View>
                  </Pressable>
                );
              })}
            </Card>
            {note && (
              <Text style={{ fontSize: 12, color: t.ink3, fontFamily: fonts.body, lineHeight: 18 }}>{note}</Text>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
