// Home / Dashboard — greeting, child hero, recent grades, homework, messages preview.

import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import Svg, { Path } from "react-native-svg";

import { Logo } from "@/components/Logo";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { Card, Chip } from "@/components/Card";
import { Sparkline } from "@/components/Charts";
import { useTheme, fonts, radii } from "@/lib/theme";
import { T, useT } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { MOCK, type Grade, type Homework } from "@/lib/mock";
import { getChild, listGrades, listHomework, listThreads, type Child, type Thread } from "@/lib/db";

export default function Home() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const { session } = useAuth();
  const parentName = session?.fullName ?? MOCK.parent.name;

  const [child, setChild] = useState<Child | null>(null);
  const [grades, setGrades] = useState<Grade[] | null>(null);
  const [homework, setHomework] = useState<Homework[] | null>(null);
  const [threads, setThreads] = useState<Thread[] | null>(null);

  useEffect(() => {
    Promise.all([getChild(), listGrades(5), listHomework(), listThreads()]).then(([c, g, h, th]) => {
      setChild(c);
      setGrades(g);
      setHomework(h);
      setThreads(th);
    });
  }, []);

  if (!child || !grades || !homework || !threads) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={t.brand} />
      </SafeAreaView>
    );
  }

  const upcoming = homework.find((h) => h.status === "todo") ?? homework[0];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        <HeaderGreeting parentName={parentName} onBell={() => router.push("/notifications")} />

        <View style={{ padding: 20, paddingTop: 12, gap: 14 }}>
          <ChildHero child={child} />

          <SectionTitle
            title={{ fr: "Nouvelles notes", en: "New grades" }}
            action={{ fr: "Tout voir", en: "See all", onPress: () => router.push("/(tabs)/grades") }}
          />
          <View style={{ gap: 10 }}>
            {grades.slice(0, 2).map((g, i) => (
              <GradeRow key={i} g={g} />
            ))}
            {grades.length === 0 && (
              <Text style={{ textAlign: "center", color: t.ink3, fontSize: 12.5, padding: 12, fontFamily: fonts.body }}>
                <T fr="Pas encore de notes." en="No grades yet." />
              </Text>
            )}
          </View>

          <SectionTitle
            title={{ fr: "À faire pour demain", en: "Due tomorrow" }}
            action={{ fr: "Tout voir", en: "See all", onPress: () => router.push("/(tabs)/homework") }}
          />
          {upcoming ? (
            <HomeworkCard hw={upcoming} />
          ) : (
            <Text style={{ textAlign: "center", color: t.ink3, fontSize: 12.5, padding: 12, fontFamily: fonts.body }}>
              <T fr="Aucun devoir." en="No homework." />
            </Text>
          )}

          <SectionTitle
            title={{ fr: "Messagerie", en: "Inbox" }}
            action={{ fr: "Ouvrir", en: "Open", onPress: () => router.push("/(tabs)/messages") }}
          />
          {threads.length > 0 ? (
            <Card style={{ padding: 4 }}>
              {threads.slice(0, 2).map((th, i) => (
                <Pressable
                  key={th.id}
                  onPress={() => router.push(`/thread/${th.id}`)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    padding: 12,
                    borderBottomWidth: i < 1 && threads.length > 1 ? 1 : 0,
                    borderBottomColor: t.divider,
                  }}
                >
                  <Avatar name={th.from} size={40} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                      <Text style={{ fontSize: 13.5, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold }}>{th.from}</Text>
                      <Text style={{ fontSize: 11, color: t.ink3, marginLeft: 6, fontFamily: fonts.body }}> · {th.subject}</Text>
                      <Text style={{ marginLeft: "auto", fontSize: 11, color: t.ink3, fontFamily: fonts.body }}>{th.time}</Text>
                    </View>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 12.5,
                        color: th.unread ? t.ink : t.ink3,
                        fontWeight: th.unread ? "600" : "400",
                        marginTop: 2,
                        fontFamily: th.unread ? fonts.bodyBold : fonts.body,
                      }}
                    >
                      {th.preview}
                    </Text>
                  </View>
                  {th.unread && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.brand }} />}
                </Pressable>
              ))}
            </Card>
          ) : (
            <Text style={{ textAlign: "center", color: t.ink3, fontSize: 12.5, padding: 12, fontFamily: fonts.body }}>
              <T fr="Pas de message." en="No messages." />
            </Text>
          )}
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

function ChildHero({ child }: { child: Child }) {
  const t = useTheme();
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
        <Avatar name={child.name} size={52} style={{ backgroundColor: "rgba(255,255,255,0.15)", borderWidth: 2, borderColor: "rgba(255,255,255,0.3)" }} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, color: "white", opacity: 0.85, fontWeight: "600", letterSpacing: 0.6, textTransform: "uppercase", fontFamily: fonts.body }}>
            <T fr="Mon enfant" en="My child" />
          </Text>
          <Text style={{ fontSize: 18, color: "white", fontWeight: "700", fontFamily: fonts.display }}>{child.name}</Text>
          <Text style={{ fontSize: 12, color: "white", opacity: 0.85, marginTop: 1, fontFamily: fonts.body }}>
            {child.grade} · {child.school}
          </Text>
        </View>
      </View>
      <View style={{ marginTop: 16, flexDirection: "row", alignItems: "center", gap: 14 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, color: "white", opacity: 0.85, fontWeight: "600", fontFamily: fonts.body }}>
            <T fr="Moyenne générale" en="Overall average" />
          </Text>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6, marginTop: 4 }}>
            <Text style={{ fontSize: 36, color: "white", fontWeight: "700", fontFamily: fonts.display, letterSpacing: -1 }}>{child.avg}</Text>
            <Text style={{ fontSize: 14, color: "white", opacity: 0.85, fontFamily: fonts.body }}>/20</Text>
            <View style={{ marginLeft: 4, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.2)", flexDirection: "row", alignItems: "center", gap: 3 }}>
              <Icon name="arrowUp" size={10} color="white" />
              <Text style={{ fontSize: 11, color: "white", fontWeight: "700", fontFamily: fonts.bodyBold }}>+0.4</Text>
            </View>
          </View>
          <Text style={{ fontSize: 11, color: "white", opacity: 0.85, marginTop: 6, fontFamily: fonts.body }}>
            <T fr={`Rang ${child.rank} sur ${child.total}`} en={`Rank ${child.rank} of ${child.total}`} />
          </Text>
        </View>
        <Sparkline values={MOCK.weekly} w={92} h={36} color="white" />
      </View>
    </View>
  );
}

function SectionTitle({ title, action }: { title: { fr: string; en: string }; action?: { fr: string; en: string; onPress: () => void } }) {
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
      <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: subj.color + "22", alignItems: "center", justifyContent: "center" }}>
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
        <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: subj.color + "22", alignItems: "center", justifyContent: "center" }}>
          <Icon name="file" size={18} color={subj.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13.5, fontWeight: "600", color: t.ink, fontFamily: fonts.bodyBold }}>{hw.title}</Text>
          <Text style={{ fontSize: 11.5, color: t.ink3, marginTop: 2, fontFamily: fonts.body }}>
            {hw.subject} · {hw.teacher}
          </Text>
          <View style={{ marginTop: 10, flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Chip tone="warn" icon={<Icon name="clock" size={11} color={t.warning} />} label={hw.due} />
            <Pressable style={{ marginLeft: "auto", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: t.brandSoft }}>
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

// Kept for backwards-compat with messages.tsx which used to import MessageRow.
export { Card } from "@/components/Card";
