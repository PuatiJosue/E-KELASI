import { View, Text, Switch, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";

import { ScreenHeader } from "@/components/ScreenHeader";
import { Card } from "@/components/Card";
import { useTheme, fonts } from "@/lib/theme";
import { useT } from "@/lib/i18n";
import { registerForPushNotifications } from "@/lib/push";

const KEY = "ekelasi.notifEnabled";

export default function AccountNotifications() {
  const t = useTheme();
  const tr = useT();
  const [enabled, setEnabled] = useState(true);
  const [ready, setReady] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync(KEY)
      .then((v) => setEnabled(v !== "false"))
      .finally(() => setReady(true));
  }, []);

  const toggle = async (val: boolean) => {
    setEnabled(val);
    setNote(null);
    await SecureStore.setItemAsync(KEY, val ? "true" : "false").catch(() => {});
    if (val) {
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
            <Card style={{ padding: 16, flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14.5, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold }}>
                  {tr({ fr: "Notifications push", en: "Push notifications" })}
                </Text>
                <Text style={{ fontSize: 12.5, color: t.ink3, marginTop: 2, fontFamily: fonts.body }}>
                  {tr({ fr: "Notes, devoirs et messages de l'école", en: "Grades, homework and school messages" })}
                </Text>
              </View>
              <Switch
                value={enabled}
                onValueChange={toggle}
                trackColor={{ false: t.surface3, true: t.brand }}
                thumbColor="#fff"
              />
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
