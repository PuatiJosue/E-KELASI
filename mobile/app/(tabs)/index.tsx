// Accueil — en-tête, salutation, grille de fonctions, « Mes enfants ».

import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import Svg, { Path } from "react-native-svg";

import { Logo } from "@/components/Logo";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { Card, Chip } from "@/components/Card";
import { useTheme, fonts, radii } from "@/lib/theme";
import { T, useT } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useChildren } from "@/lib/children";
import { type Grade, type Homework } from "@/lib/mock";
import { hasPendingChild, type Child } from "@/lib/db";

// Les 6 fonctions de l'accueil (icône + couleur + destination).
const FEATURES: {
  key: string;
  icon: string;
  color: string;
  fr: string;
  en: string;
  subFr: string;
  subEn: string;
  route: string | null;
}[] = [
  { key: "presence", icon: "users", color: "#4F66E8", fr: "Présence", en: "Attendance", subFr: "Présences de mon enfant", subEn: "My child's attendance", route: null },
  { key: "resultats", icon: "chart", color: "#16A34A", fr: "Résultats", en: "Results", subFr: "Notes et bulletins", subEn: "Grades and reports", route: "/(tabs)/grades" },
  { key: "emploi", icon: "calendar", color: "#F59E0B", fr: "Emploi du temps", en: "Timetable", subFr: "Cours et matières", subEn: "Classes and subjects", route: null },
  { key: "messages", icon: "chat", color: "#8B5CF6", fr: "Messages", en: "Messages", subFr: "École et notifications", subEn: "School and notifications", route: "/(tabs)/messages" },
  { key: "paiements", icon: "creditcard", color: "#EC4899", fr: "Paiements", en: "Payments", subFr: "Frais et historique", subEn: "Fees and history", route: null },
  { key: "espace", icon: "folder", color: "#0EA5E9", fr: "Espace numérique", en: "Digital space", subFr: "Bibliothèque et vidéos", subEn: "Library and videos", route: "/espace-numerique" },
];

export default function Home() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const { session } = useAuth();
  const parentName = session?.fullName ?? "Parent";
  const { children, loading: childrenLoading, selectChild, refresh } = useChildren();

  const [pending, setPending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const reload = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  useEffect(() => {
    if (!childrenLoading && children.length === 0) {
      hasPendingChild().then(setPending).catch(() => setPending(false));
    }
  }, [childrenLoading, children.length]);

  if (childrenLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={t.brand} />
      </SafeAreaView>
    );
  }

  // Aucun enfant rattaché.
  if (children.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={["top"]}>
        <HeaderGreeting parentName={parentName} onBell={() => router.push("/notifications")} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 }}>
          <Icon name={pending ? "clock" : "user"} size={40} color={pending ? t.warning : t.ink3} />
          <Text style={{ fontSize: 16, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold, textAlign: "center" }}>
            {pending
              ? tr({ fr: "En attente de validation", en: "Awaiting validation" })
              : tr({ fr: "Aucun enfant enregistré", en: "No child registered" })}
          </Text>
          <Text style={{ fontSize: 13, color: t.ink3, textAlign: "center", fontFamily: fonts.body, lineHeight: 20 }}>
            {pending
              ? tr({ fr: "Votre demande a été envoyée. L'école doit valider l'inscription de votre enfant.", en: "Your request was sent. The school must confirm your child's enrollment." })
              : tr({ fr: "Enregistrez votre enfant : l'école validera et vous verrez son suivi scolaire.", en: "Register your child: the school will confirm and you'll see their school journey." })}
          </Text>
          {!pending && (
            <Pressable
              onPress={() => router.push("/account/register-child")}
              style={{ marginTop: 6, backgroundColor: t.brand, paddingVertical: 14, paddingHorizontal: 22, borderRadius: 14 }}
            >
              <Text style={{ color: t.onBrand, fontSize: 15, fontWeight: "700", fontFamily: fonts.bodyBold }}>
                {tr({ fr: "Enregistrer mon enfant", en: "Register my child" })}
              </Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const openFeature = (route: string | null, label: string) => {
    if (!route) {
      Alert.alert(label, tr({ fr: "Bientôt disponible.", en: "Coming soon." }));
      return;
    }
    router.push(route as any);
  };

  const openChild = (c: Child) => {
    selectChild(c.id);
    router.push("/(tabs)/grades");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={t.brand} />}
      >
        <HeaderGreeting parentName={parentName} onBell={() => router.push("/notifications")} />

        <View style={{ padding: 20, paddingTop: 6, gap: 20 }}>
          {/* Grille de fonctions */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {FEATURES.map((f) => (
              <Pressable
                key={f.key}
                onPress={() => openFeature(f.route, tr({ fr: f.fr, en: f.en }))}
                style={{ width: "47.5%", flexGrow: 1 }}
              >
                <Card style={{ padding: 14, gap: 10, minHeight: 118 }}>
                  <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: f.color + "1F", alignItems: "center", justifyContent: "center" }}>
                    <Icon name={f.icon} size={21} color={f.color} />
                  </View>
                  <View style={{ gap: 2 }}>
                    <Text style={{ fontSize: 14.5, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold }}>
                      <T fr={f.fr} en={f.en} />
                    </Text>
                    <Text style={{ fontSize: 11.5, color: t.ink3, fontFamily: fonts.body, lineHeight: 15 }}>
                      <T fr={f.subFr} en={f.subEn} />
                    </Text>
                  </View>
                </Card>
              </Pressable>
            ))}
          </View>

          {/* Mes enfants */}
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold }}>
                <T fr="Mes enfants" en="My children" />
              </Text>
              <Pressable onPress={() => router.push("/account/register-child")} hitSlop={8}>
                <Text style={{ fontSize: 12.5, fontWeight: "600", color: t.brand600, fontFamily: fonts.bodyBold }}>
                  <T fr="+ Ajouter" en="+ Add" />
                </Text>
              </Pressable>
            </View>
            {children.map((c) => (
              <Pressable key={c.id} onPress={() => openChild(c)}>
                <Card style={{ padding: 12, flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <Avatar name={c.name} url={c.avatarUrl} size={44} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold }}>{c.name}</Text>
                    <Text numberOfLines={1} style={{ fontSize: 12, color: t.ink3, marginTop: 1, fontFamily: fonts.body }}>
                      {[c.grade, c.option, c.school].filter(Boolean).join(" · ")}
                    </Text>
                  </View>
                  <Icon name="chevR" size={18} color={t.ink4} />
                </Card>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function HeaderGreeting({ parentName, onBell }: { parentName: string; onBell: () => void }) {
  const t = useTheme();
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
        <Logo size={30} withWord />
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={onBell}
          style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, alignItems: "center", justifyContent: "center" }}
        >
          <Icon name="bell" size={20} color={t.ink2} />
          <View style={{ position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: t.danger, borderWidth: 2, borderColor: t.surface }} />
        </Pressable>
      </View>

      {/* Bandeau de salutation */}
      <View
        style={{
          borderRadius: radii.lg,
          backgroundColor: t.brand,
          padding: 18,
          overflow: "hidden",
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          shadowColor: t.brand,
          shadowOpacity: 0.25,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 8 },
          elevation: 6,
        }}
      >
        <Svg width={150} height={150} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1} style={{ position: "absolute", top: -24, right: -24, opacity: 0.16 }}>
          <Path d="M3 10l9-5 9 5-9 5-9-5zM5 12v6c0 1 3 3 7 3s7-2 7-3v-6" />
        </Svg>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, color: "white", opacity: 0.9, fontFamily: fonts.body }}>
            <T fr="Bonjour," en="Hello," />
          </Text>
          <Text style={{ fontSize: 21, color: "white", fontWeight: "700", fontFamily: fonts.display, letterSpacing: -0.3 }} numberOfLines={1}>
            {parentName}
          </Text>
          <Text style={{ fontSize: 11.5, color: "white", opacity: 0.85, marginTop: 3, fontWeight: "600", letterSpacing: 0.4, textTransform: "uppercase", fontFamily: fonts.body }}>
            <T fr="Parent" en="Parent" />
          </Text>
        </View>
        <Avatar name={parentName} size={46} style={{ backgroundColor: "rgba(255,255,255,0.18)", borderWidth: 2, borderColor: "rgba(255,255,255,0.3)" }} />
      </View>
    </View>
  );
}

// Couleur + code court d'une matière, dérivés de son nom (sans données fictives).
const SUBJECT_COLORS = ["#4F66E8", "#D97706", "#16A34A", "#0EA5E9", "#E11D48", "#8B5CF6", "#14B8A6", "#F59E0B"];
export function subjectVisual(name: string): { short: string; color: string } {
  const n = name || "?";
  const short = n.slice(0, 3).toUpperCase();
  let h = 0;
  for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0;
  return { short, color: SUBJECT_COLORS[h % SUBJECT_COLORS.length] };
}

export function GradeRow({ g }: { g: Grade }) {
  const t = useTheme();
  const subj = subjectVisual(g.subject);
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
  const subj = subjectVisual(hw.subject);
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
          </View>
        </View>
      </View>
    </Card>
  );
}

// Kept for backwards-compat with messages.tsx which used to import MessageRow.
export { Card } from "@/components/Card";
