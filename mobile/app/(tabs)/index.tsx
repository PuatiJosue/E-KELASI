// Home / Dashboard — greeting, child hero, recent grades, homework, messages preview.

import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";

import { Logo } from "@/components/Logo";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { Card, Chip } from "@/components/Card";
import { Sparkline } from "@/components/Charts";
import { useTheme, fonts, radii } from "@/lib/theme";
import { T, useT } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { MOCK, type Grade, type Homework, type Message } from "@/lib/mock";

export default function Home() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const { session } = useAuth();
  const parentName = session?.fullName ?? MOCK.parent.name;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        <HeaderGreeting parentName={parentName} onBell={() => router.push("/notifications")} />

        <View style={{ padding: 20, paddingTop: 12, gap: 14 }}>
          <ChildHero />

          <SectionTitle
            title={{ fr: "Nouvelles notes", en: "New grades" }}
            action={{ fr: "Tout voir", en: "See all", onPress: () => router.push("/(tabs)/grades") }}
          />
          <View style={{ gap: 10 }}>
            {MOCK.grades.slice(0, 2).map((g, i) => (
              <GradeRow key={i} g={g} />
            ))}
          </View>

          <SectionTitle
            title={{ fr: "À faire pour demain", en: "Due tomorrow" }}
            action={{ fr: "Tout voir", en: "See all", onPress: () => router.push("/(tabs)/homework") }}
          />
          <HomeworkCard hw={MOCK.homework[0]} />

          <SectionTitle
            title={{ fr: "Messagerie", en: "Inbox" }}
            action={{ fr: "Ouvrir", en: "Open", onPress: () => router.push("/(tabs)/messages") }}
          />
          <Card style={{ padding: 4 }}>
            {MOCK.messages.slice(0, 2).map((m, i) => (
              <MessageRow key={i} m={m} divider={i < 1} onPress={() => router.push("/thread/1")} />
            ))}
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function HeaderGreeting({ parentName, onBell }: { parentName: string; onBell: () => void }) {
  const t = useTheme();
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, flexDirection: "row", alignItems: "center", gap: 12 }}>
      <Logo size={26} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, color: t.ink3, fontWeight: "500", fontFamily: fonts.body }}>
          <T fr="Bonjour" en="Hello" />,
        </Text>
        <Text style={{ fontSize: 16, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold }}>{parentName}</Text>
      </View>
      <Pressable
        onPress={onBell}
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: t.surface,
          borderWidth: 1,
          borderColor: t.border,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name="bell" size={20} color={t.ink2} />
        <View
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: t.brand,
            borderWidth: 2,
            borderColor: t.surface,
          }}
        />
      </Pressable>
    </View>
  );
}

function ChildHero() {
  const t = useTheme();
  const c = MOCK.child;
  return (
    <View
      style={{
        padding: 18,
        borderRadius: radii.lg,
        backgroundColor: t.brand,
        position: "relative",
        overflow: "hidden",
        shadowColor: t.brand,
        shadowOpacity: 0.25,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
      }}
    >
      <Svg
        width={160}
        height={160}
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth={1}
        style={{ position: "absolute", top: -20, right: -20, opacity: 0.18 }}
      >
        <Path d="M3 10l9-5 9 5-9 5-9-5zM5 12v6c0 1 3 3 7 3s7-2 7-3v-6" />
      </Svg>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Avatar name={c.name} size={52} style={{ backgroundColor: "rgba(255,255,255,0.15)", borderWidth: 2, borderColor: "rgba(255,255,255,0.3)" }} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, color: "white", opacity: 0.85, fontWeight: "600", letterSpacing: 0.6, textTransform: "uppercase", fontFamily: fonts.body }}>
            <T fr="Mon enfant" en="My child" />
          </Text>
          <Text style={{ fontSize: 18, color: "white", fontWeight: "700", fontFamily: fonts.display }}>{c.name}</Text>
          <Text style={{ fontSize: 12, color: "white", opacity: 0.85, marginTop: 1, fontFamily: fonts.body }}>
            {c.grade} · {c.school}
          </Text>
        </View>
      </View>
      <View style={{ marginTop: 16, flexDirection: "row", alignItems: "center", gap: 14 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, color: "white", opacity: 0.85, fontWeight: "600", fontFamily: fonts.body }}>
            <T fr="Moyenne générale" en="Overall average" />
          </Text>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6, marginTop: 4 }}>
            <Text style={{ fontSize: 36, color: "white", fontWeight: "700", fontFamily: fonts.display, letterSpacing: -1 }}>{c.avg}</Text>
            <Text style={{ fontSize: 14, color: "white", opacity: 0.85, fontFamily: fonts.body }}>/20</Text>
            <View
              style={{
                marginLeft: 4,
                paddingHorizontal: 7,
                paddingVertical: 2,
                borderRadius: 999,
                backgroundColor: "rgba(255,255,255,0.2)",
                flexDirection: "row",
                alignItems: "center",
                gap: 3,
              }}
            >
              <Icon name="arrowUp" size={10} color="white" />
              <Text style={{ fontSize: 11, color: "white", fontWeight: "700", fontFamily: fonts.bodyBold }}>+0.4</Text>
            </View>
          </View>
          <Text style={{ fontSize: 11, color: "white", opacity: 0.85, marginTop: 6, fontFamily: fonts.body }}>
            <T fr={`Rang ${c.rank} sur ${c.total}`} en={`Rank ${c.rank} of ${c.total}`} />
          </Text>
        </View>
        <Sparkline values={MOCK.weekly} w={92} h={36} color="white" />
      </View>
    </View>
  );
}

function SectionTitle({
  title,
  action,
}: {
  title: { fr: string; en: string };
  action?: { fr: string; en: string; onPress: () => void };
}) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginTop: 4 }}>
      <Text style={{ fontSize: 14, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold }}>
        <T fr={title.fr} en={title.en} />
      </Text>
      {action && (
        <Pressable onPress={action.onPress}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: t.brand600, fontFamily: fonts.bodyBold }}>
            <T fr={action.fr} en={action.en} />
          </Text>
        </Pressable>
      )}
    </View>
  );
}

export function GradeRow({ g }: { g: Grade }) {
  const t = useTheme();
  const subj = MOCK.subjects.find((s) => s.name === g.subject) ?? MOCK.subjects[0];
  const pct = g.score / g.max;
  const toneColor = pct >= 0.75 ? t.accent : pct >= 0.5 ? t.warning : t.danger;
  return (
    <Card style={{ padding: 12, flexDirection: "row", alignItems: "center", gap: 12 }}>
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 11,
          backgroundColor: subj.color + "22",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: subj.color, fontWeight: "700", fontSize: 11, fontFamily: fonts.displayMedium }}>{subj.short}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13.5, fontWeight: "600", color: t.ink, fontFamily: fonts.bodyBold }} numberOfLines={1}>
          {g.kind}
        </Text>
        <Text style={{ fontSize: 11.5, color: t.ink3, marginTop: 2, fontFamily: fonts.body }}>
          {g.subject} · {g.date}
        </Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <View style={{ flexDirection: "row", alignItems: "baseline" }}>
          <Text style={{ fontSize: 18, fontWeight: "700", fontFamily: fonts.display, color: toneColor, letterSpacing: -0.5 }}>{g.score}</Text>
          <Text style={{ fontSize: 11, color: t.ink3, fontWeight: "600", fontFamily: fonts.body }}>/{g.max}</Text>
        </View>
        <Text style={{ fontSize: 10, color: t.ink3, marginTop: 1, fontFamily: fonts.body }}>coef. {g.coef}</Text>
      </View>
    </Card>
  );
}

export function HomeworkCard({ hw }: { hw: Homework }) {
  const t = useTheme();
  const subj = MOCK.subjects.find((s) => s.name === hw.subject) ?? MOCK.subjects[0];
  return (
    <Card style={{ padding: 14 }}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            backgroundColor: subj.color + "22",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="file" size={18} color={subj.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13.5, fontWeight: "600", color: t.ink, fontFamily: fonts.bodyBold }}>{hw.title}</Text>
          <Text style={{ fontSize: 11.5, color: t.ink3, marginTop: 2, fontFamily: fonts.body }}>
            {hw.subject} · {hw.teacher}
          </Text>
          <View style={{ marginTop: 10, flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Chip
              tone="warn"
              icon={<Icon name="clock" size={11} color={t.warning} />}
              label={hw.due}
            />
            <Pressable
              style={{
                marginLeft: "auto",
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: t.brandSoft,
              }}
            >
              <Text style={{ color: t.brand600, fontSize: 12, fontWeight: "600", fontFamily: fonts.bodyBold }}>
                <T fr="Voir" en="Open" /> →
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Card>
  );
}

export function MessageRow({ m, divider, onPress }: { m: Message; divider?: boolean; onPress?: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 12,
        borderBottomWidth: divider ? 1 : 0,
        borderBottomColor: t.divider,
      }}
    >
      <Avatar name={m.from} size={40} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "baseline" }}>
          <Text style={{ fontSize: 13.5, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold }}>{m.from}</Text>
          <Text style={{ fontSize: 11, color: t.ink3, marginLeft: 6, fontFamily: fonts.body }}> · {m.subject}</Text>
          <Text style={{ marginLeft: "auto", fontSize: 11, color: t.ink3, fontFamily: fonts.body }}>{m.time}</Text>
        </View>
        <Text
          numberOfLines={1}
          style={{
            fontSize: 12.5,
            color: m.unread ? t.ink : t.ink3,
            fontWeight: m.unread ? "600" : "400",
            marginTop: 2,
            fontFamily: m.unread ? fonts.bodyBold : fonts.body,
          }}
        >
          {m.preview}
        </Text>
      </View>
      {m.unread && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.brand }} />}
    </Pressable>
  );
}
