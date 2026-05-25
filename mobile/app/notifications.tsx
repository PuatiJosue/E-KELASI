import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { Card } from "@/components/Card";
import { Icon } from "@/components/Icon";
import { useTheme, fonts } from "@/lib/theme";
import { T } from "@/lib/i18n";
import { MOCK, type Notification } from "@/lib/mock";

const ICON_BY_KIND: Record<Notification["kind"], string> = {
  grade: "award",
  message: "chat",
  hw: "book",
  school: "school",
  reminder: "flag",
};

export default function NotificationsScreen() {
  const t = useTheme();
  const router = useRouter();

  const colorByKind: Record<Notification["kind"], string> = {
    grade: t.accent,
    message: t.info,
    hw: t.brand,
    school: t.ink2,
    reminder: t.warning,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={["top", "bottom"]}>
      <View
        style={{
          paddingVertical: 8,
          paddingHorizontal: 12,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="chevL" size={20} color={t.ink2} />
        </Pressable>
        <Text style={{ flex: 1, fontSize: 17, fontWeight: "700", color: t.ink, fontFamily: fonts.display }}>
          <T fr="Notifications" en="Notifications" />
        </Text>
        <Pressable>
          <Text style={{ fontSize: 12, color: t.brand600, fontWeight: "600", fontFamily: fonts.bodyBold }}>
            <T fr="Tout marquer lu" en="Mark all read" />
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20, gap: 8 }}>
        {MOCK.notifs.map((n, i) => (
          <Card
            key={i}
            style={{
              padding: 14,
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 12,
              borderLeftWidth: i < 2 ? 3 : 0,
              borderLeftColor: t.brand,
            }}
          >
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                backgroundColor: colorByKind[n.kind] + "22",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name={ICON_BY_KIND[n.kind]} size={16} color={colorByKind[n.kind]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13.5, color: t.ink, fontWeight: i < 2 ? "600" : "500", fontFamily: i < 2 ? fonts.bodyBold : fonts.body }}>{n.text}</Text>
              <Text style={{ fontSize: 11, color: t.ink3, marginTop: 2, fontFamily: fonts.body }}>{n.time}</Text>
            </View>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
