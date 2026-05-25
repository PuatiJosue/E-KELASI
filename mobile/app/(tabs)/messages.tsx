import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { Card } from "@/components/Card";
import { MessageRow } from "./index";
import { Icon } from "@/components/Icon";
import { useTheme, fonts } from "@/lib/theme";
import { T, useT } from "@/lib/i18n";
import { MOCK } from "@/lib/mock";

export default function Messages() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 4,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View>
            <Text style={{ fontSize: 11, color: t.ink3, fontWeight: "600", letterSpacing: 0.6, textTransform: "uppercase", fontFamily: fonts.body }}>
              <T fr="Conversations" en="Conversations" />
            </Text>
            <Text style={{ fontSize: 26, fontWeight: "700", color: t.ink, fontFamily: fonts.display, letterSpacing: -0.7 }}>
              <T fr="Messagerie" en="Inbox" />
            </Text>
          </View>
          <Pressable
            style={{
              width: 38,
              height: 38,
              borderRadius: 11,
              backgroundColor: t.brand,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: t.brand,
              shadowOpacity: 0.3,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 4,
            }}
          >
            <Icon name="edit" size={17} color="white" />
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 20, paddingVertical: 12 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: t.surface2,
            }}
          >
            <Icon name="search" size={16} color={t.ink3} />
            <Text style={{ color: t.ink3, fontSize: 13.5, fontFamily: fonts.body }}>
              {tr({ fr: "Rechercher un professeur, un sujet…", en: "Search a teacher, a subject…" })}
            </Text>
          </View>
        </View>

        <Card style={{ marginHorizontal: 20, padding: 4 }}>
          {MOCK.messages.map((m, i) => (
            <MessageRow
              key={i}
              m={m}
              divider={i < MOCK.messages.length - 1}
              onPress={() => router.push(`/thread/${i}`)}
            />
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
