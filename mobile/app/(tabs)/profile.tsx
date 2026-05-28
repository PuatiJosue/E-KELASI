import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import Svg, { Path } from "react-native-svg";

import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/Card";
import { Icon } from "@/components/Icon";
import { useTheme, fonts, radii } from "@/lib/theme";
import { T, useT, useLang, useSetLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { MOCK } from "@/lib/mock";
import { getChild, type Child } from "@/lib/db";

const GROUPS = [
  {
    title: { fr: "Compte", en: "Account" },
    items: [
      { icon: "user",       fr: "Informations personnelles", en: "Personal info" },
      { icon: "school",     fr: "Enfants & écoles",          en: "Children & schools", detail: "1" },
      { icon: "creditcard", fr: "Paiement & facturation",    en: "Billing" },
    ],
  },
  {
    title: { fr: "Préférences", en: "Preferences" },
    items: [
      { icon: "bell",       fr: "Notifications",  en: "Notifications", detail: "Tout" },
      { icon: "mail",       fr: "Langue",         en: "Language",      detail: "FR" },
      { icon: "moon",       fr: "Apparence",      en: "Appearance",    detail: "Auto" },
    ],
  },
  {
    title: { fr: "Sécurité & aide", en: "Security & help" },
    items: [
      { icon: "lock",       fr: "Confidentialité",      en: "Privacy" },
      { icon: "shield",     fr: "Sécurité du compte",   en: "Account security" },
      { icon: "mail",       fr: "Contacter le support", en: "Contact support" },
    ],
  },
] as const;

export default function Profile() {
  const t = useTheme();
  const tr = useT();
  const lang = useLang();
  const setLang = useSetLang();
  const router = useRouter();
  const { session, signOut } = useAuth();
  const [child, setChild] = useState<Child | null>(null);

  useEffect(() => {
    getChild().then(setChild).catch(() => {});
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.replace("/");
  };

  // Mettre à jour la 2e ligne "Enfants & écoles" avec le compte réel
  const groupsWithChild = GROUPS.map((g) =>
    g.title.fr === "Compte"
      ? {
          ...g,
          items: g.items.map((it) =>
            it.fr === "Enfants & écoles" ? { ...it, detail: child ? "1" : "—" } : it
          ),
        }
      : g
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <View style={{ paddingVertical: 24, paddingHorizontal: 20, alignItems: "center" }}>
          <Avatar name={session?.fullName ?? MOCK.parent.name} size={72} />
          <Text style={{ marginTop: 12, fontSize: 18, fontWeight: "700", color: t.ink, fontFamily: fonts.display }}>
            {session?.fullName ?? MOCK.parent.name}
          </Text>
          <Text style={{ fontSize: 12, color: t.ink3, marginTop: 2, fontFamily: fonts.body }}>
            {session?.email ?? MOCK.parent.email}
          </Text>
        </View>

        {/* Subscription banner */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 14 }}>
          <View
            style={{
              padding: 16,
              borderRadius: radii.lg,
              backgroundColor: t.accent,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Svg width={140} height={140} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1} style={{ position: "absolute", top: -20, right: -20, opacity: 0.12 }}>
              <Path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2-5.5-2.9-5.5 2.9 1-6.2-4.5-4.4 6.2-.9z" />
            </Svg>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Icon name="star" size={16} color="#FFD8A8" />
              <Text style={{ fontSize: 11, color: "white", fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase", opacity: 0.95, fontFamily: fonts.bodyBold }}>
                <T fr="Abonnement actif" en="Active subscription" />
              </Text>
            </View>
            <Text style={{ fontSize: 22, color: "white", fontWeight: "700", fontFamily: fonts.display, marginTop: 8 }}>
              E-KELASI <T fr="Famille" en="Family" />
            </Text>
            <Text style={{ fontSize: 12.5, color: "white", opacity: 0.9, marginTop: 4, fontFamily: fonts.body }}>
              {tr({
                fr: `Jusqu'à 3 enfants · Renouvellement le ${MOCK.parent.renews}`,
                en: `Up to 3 children · Renews on ${MOCK.parent.renews}`,
              })}
            </Text>
            <Pressable
              onPress={() => router.push("/subscribe")}
              style={{
                marginTop: 14,
                paddingHorizontal: 14,
                paddingVertical: 9,
                borderRadius: 10,
                backgroundColor: "rgba(255,255,255,0.18)",
                alignSelf: "flex-start",
              }}
            >
              <Text style={{ color: "white", fontSize: 13, fontWeight: "600", fontFamily: fonts.bodyBold }}>
                <T fr="Gérer l'abonnement" en="Manage subscription" /> →
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Language toggle */}
        <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
          <Text style={{ fontSize: 11, color: t.ink3, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase", paddingHorizontal: 4, paddingBottom: 8, fontFamily: fonts.body }}>
            <T fr="Langue" en="Language" />
          </Text>
          <Card style={{ padding: 6, flexDirection: "row", gap: 6 }}>
            {(["fr", "en"] as const).map((l) => {
              const on = lang === l;
              return (
                <Pressable
                  key={l}
                  onPress={() => setLang(l)}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 10,
                    backgroundColor: on ? t.brand : "transparent",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "700", color: on ? t.onBrand : t.ink2, fontFamily: fonts.bodyBold }}>
                    {l === "fr" ? "🇫🇷  Français" : "🇬🇧  English"}
                  </Text>
                </Pressable>
              );
            })}
          </Card>
        </View>

        {/* Settings groups */}
        <View style={{ paddingHorizontal: 20, gap: 10 }}>
          {groupsWithChild.map((g, i) => (
            <SettingsGroup key={i} group={g} />
          ))}

          <Pressable
            onPress={handleSignOut}
            style={{
              marginTop: 14,
              padding: 14,
              borderRadius: radii.md,
              alignItems: "center",
              backgroundColor: t.surface,
              borderWidth: 1,
              borderColor: t.border,
            }}
          >
            <Text style={{ color: t.danger, fontSize: 13.5, fontWeight: "600", fontFamily: fonts.bodyBold }}>
              <T fr="Se déconnecter" en="Sign out" />
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsGroup({
  group,
}: {
  group: {
    title: { fr: string; en: string };
    items: ReadonlyArray<{ icon: string; fr: string; en: string; detail?: string }>;
  };
}) {
  const t = useTheme();
  return (
    <View>
      <Text style={{ fontSize: 11, color: t.ink3, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase", paddingHorizontal: 4, paddingBottom: 8, fontFamily: fonts.body }}>
        <T fr={group.title.fr} en={group.title.en} />
      </Text>
      <Card style={{ padding: 4 }}>
        {group.items.map((it, i) => (
          <View
            key={i}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              padding: 12,
              borderBottomWidth: i < group.items.length - 1 ? 1 : 0,
              borderBottomColor: t.divider,
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                backgroundColor: t.surface2,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name={it.icon} size={16} color={t.ink2} />
            </View>
            <Text style={{ flex: 1, fontSize: 14, color: t.ink, fontWeight: "500", fontFamily: fonts.body }}>
              <T fr={it.fr} en={it.en} />
            </Text>
            {it.detail && <Text style={{ fontSize: 12, color: t.ink3, fontFamily: fonts.body }}>{it.detail}</Text>}
            <Icon name="chevR" size={16} color={t.ink4} />
          </View>
        ))}
      </Card>
    </View>
  );
}
