import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/ScreenHeader";
import { Card } from "@/components/Card";
import { Icon } from "@/components/Icon";
import { useTheme, fonts } from "@/lib/theme";
import { useT } from "@/lib/i18n";
import { useThemePref, type ThemeMode } from "@/lib/themePref";

export default function AccountAppearance() {
  const t = useTheme();
  const tr = useT();
  const { mode, setMode } = useThemePref();

  const options: { id: ThemeMode; fr: string; en: string; icon: string }[] = [
    { id: "auto", fr: "Automatique (système)", en: "Automatic (system)", icon: "settings" },
    { id: "light", fr: "Clair", en: "Light", icon: "sun" },
    { id: "dark", fr: "Sombre", en: "Dark", icon: "moon" },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={["top", "bottom"]}>
      <ScreenHeader title={tr({ fr: "Apparence", en: "Appearance" })} />
      <View style={{ padding: 20 }}>
        <Card style={{ padding: 4 }}>
          {options.map((o, i) => {
            const on = mode === o.id;
            return (
              <Pressable
                key={o.id}
                onPress={() => setMode(o.id)}
                style={{
                  flexDirection: "row", alignItems: "center", gap: 12, padding: 14,
                  borderBottomWidth: i < options.length - 1 ? 1 : 0, borderBottomColor: t.divider,
                }}
              >
                <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: t.surface2, alignItems: "center", justifyContent: "center" }}>
                  <Icon name={o.icon} size={16} color={t.ink2} />
                </View>
                <Text style={{ flex: 1, fontSize: 14, color: t.ink, fontWeight: "500", fontFamily: fonts.body }}>
                  {tr({ fr: o.fr, en: o.en })}
                </Text>
                {on && <Icon name="check" size={18} color={t.brand} />}
              </Pressable>
            );
          })}
        </Card>
      </View>
    </SafeAreaView>
  );
}
