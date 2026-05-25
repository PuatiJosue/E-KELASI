import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";

import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { useTheme, fonts } from "@/lib/theme";
import { T, useT } from "@/lib/i18n";
import { MOCK } from "@/lib/mock";

export default function Thread() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const idx = Number(id ?? 0) || 0;
  const m = MOCK.messages[idx] ?? MOCK.messages[0];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={["top", "bottom"]}>
      {/* Header */}
      <View
        style={{
          paddingVertical: 8,
          paddingHorizontal: 12,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          borderBottomWidth: 1,
          borderBottomColor: t.divider,
          backgroundColor: t.surface,
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
        <Avatar name={m.from} size={36} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold }}>{m.from}</Text>
          <Text style={{ fontSize: 11, color: t.ink3, fontFamily: fonts.body }}>
            <T fr="Prof. de Français · En ligne" en="French teacher · Online" />
          </Text>
        </View>
      </View>

      {/* Messages */}
      <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
        <DayDivider label={{ fr: "Aujourd'hui", en: "Today" }} />
        <Bubble who="them">
          <T
            fr="Bonjour, j'ai voulu vous faire un retour sur Amina. Elle progresse vraiment bien en compréhension écrite cette semaine."
            en="Hello, I wanted to share an update on Amina. Her reading comprehension is improving a lot this week."
          />
        </Bubble>
        <Bubble who="them">
          <T
            fr="Continuez la lecture du soir, ça porte ses fruits 🙂"
            en="Keep up the bedtime reading — it's paying off 🙂"
          />
          <Text style={{ fontSize: 10, color: t.ink3, marginTop: 4, fontFamily: fonts.body }}>10:24</Text>
        </Bubble>
        <Bubble who="me">
          <T
            fr="Merci beaucoup pour ce retour ! On va continuer. Le chapitre 6 est prévu pour ce soir."
            en="Thank you so much for the update! We'll keep going. Chapter 6 is on tonight's reading list."
          />
          <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", marginTop: 4, fontFamily: fonts.body }}>
            10:31 · {tr({ fr: "Lu", en: "Read" })}
          </Text>
        </Bubble>
        <Bubble who="them">
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Icon name="paperclip" size={14} color={t.ink} />
            <Text style={{ fontSize: 13.5, color: t.ink, textDecorationLine: "underline", fontFamily: fonts.body }}>
              Plan_lecture_T2.pdf
            </Text>
          </View>
        </Bubble>
      </ScrollView>

      {/* Composer */}
      <View
        style={{
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderTopWidth: 1,
          borderTopColor: t.divider,
          backgroundColor: t.surface,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Pressable
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="plus" size={20} color={t.ink3} />
        </Pressable>
        <View
          style={{
            flex: 1,
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 20,
            backgroundColor: t.surface2,
          }}
        >
          <Text style={{ color: t.ink3, fontSize: 13.5, fontFamily: fonts.body }}>
            {tr({ fr: "Écrire un message…", en: "Type a message…" })}
          </Text>
        </View>
        <Pressable
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: t.brand,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="send" size={16} color="white" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function DayDivider({ label }: { label: { fr: string; en: string } }) {
  const t = useTheme();
  return (
    <View style={{ alignItems: "center", marginVertical: 4 }}>
      <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: t.surface2 }}>
        <Text style={{ fontSize: 10.5, color: t.ink3, fontWeight: "600", letterSpacing: 0.4, textTransform: "uppercase", fontFamily: fonts.bodyBold }}>
          <T fr={label.fr} en={label.en} />
        </Text>
      </View>
    </View>
  );
}

function Bubble({ who, children }: { who: "me" | "them"; children: React.ReactNode }) {
  const t = useTheme();
  const me = who === "me";
  return (
    <View style={{ flexDirection: "row", justifyContent: me ? "flex-end" : "flex-start" }}>
      <View
        style={{
          maxWidth: "78%",
          paddingHorizontal: 13,
          paddingVertical: 10,
          borderRadius: 16,
          borderBottomRightRadius: me ? 4 : 16,
          borderBottomLeftRadius: me ? 16 : 4,
          backgroundColor: me ? t.brand : t.surface,
          borderWidth: me ? 0 : 1,
          borderColor: t.border,
        }}
      >
        {typeof children === "string" ? (
          <Text style={{ color: me ? "white" : t.ink, fontSize: 13.5, lineHeight: 19, fontFamily: fonts.body }}>{children}</Text>
        ) : (
          <View>
            <Text style={{ color: me ? "white" : t.ink, fontSize: 13.5, lineHeight: 19, fontFamily: fonts.body }}>{children}</Text>
          </View>
        )}
      </View>
    </View>
  );
}
