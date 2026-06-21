import { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/Icon";
import { useT } from "@/lib/i18n";
import { useTheme, fonts } from "@/lib/theme";
import { getAccessStatus } from "@/lib/db";
import { useAuth } from "@/lib/auth";

function SuspendedScreen() {
  const t = useTheme();
  const tr = useT();
  const { signOut } = useAuth();
  return (
    <View style={{ flex: 1, backgroundColor: t.bg, alignItems: "center", justifyContent: "center", padding: 32 }}>
      <Icon name="lock" size={48} color={t.ink3} />
      <Text style={{ fontSize: 20, fontFamily: fonts.display, fontWeight: "700", color: t.ink, marginTop: 20, textAlign: "center" }}>
        {tr({ fr: "Accès suspendu", en: "Access suspended" })}
      </Text>
      <Text style={{ fontSize: 14, fontFamily: fonts.body, color: t.ink3, marginTop: 10, textAlign: "center", lineHeight: 21 }}>
        {tr({
          fr: "Votre accès est temporairement suspendu. Contactez l'école de votre enfant pour le réactiver.",
          en: "Your access is temporarily suspended. Contact your child's school to reactivate it.",
        })}
      </Text>
      <Pressable
        onPress={signOut}
        style={{ marginTop: 28, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10, borderWidth: 1, borderColor: t.border }}
      >
        <Text style={{ fontSize: 14, fontFamily: fonts.body, fontWeight: "600", color: t.ink }}>
          {tr({ fr: "Se déconnecter", en: "Sign out" })}
        </Text>
      </Pressable>
    </View>
  );
}

export default function TabsLayout() {
  const t = useTheme();
  const tr = useT();
  const insets = useSafeAreaInsets();

  const [blocked, setBlocked] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    getAccessStatus().then((s) => {
      setBlocked(s === "blocked");
      setReady(true);
    });
  }, []);

  if (!ready) return <View style={{ flex: 1, backgroundColor: t.bg }} />;
  if (blocked) return <SuspendedScreen />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.brand,
        tabBarInactiveTintColor: t.ink3,
        tabBarLabelStyle: {
          fontSize: 10.5,
          fontFamily: fonts.body,
          fontWeight: "500",
        },
        tabBarStyle: {
          backgroundColor: t.surface,
          borderTopColor: t.divider,
          borderTopWidth: 1,
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 8),
          height: 56 + Math.max(insets.bottom, 8),
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: tr({ fr: "Accueil", en: "Home" }),
          tabBarIcon: ({ color, focused }) => <Icon name="home" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="grades"
        options={{
          title: tr({ fr: "Notes", en: "Grades" }),
          tabBarIcon: ({ color }) => <Icon name="chart" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="homework"
        options={{
          title: tr({ fr: "Devoirs", en: "Homework" }),
          tabBarIcon: ({ color }) => <Icon name="book" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: tr({ fr: "Livres", en: "Library" }),
          tabBarIcon: ({ color }) => <Icon name="bookmark" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="dossier"
        options={{
          title: tr({ fr: "Dossier", en: "Folder" }),
          tabBarIcon: ({ color }) => <Icon name="folder" size={22} color={color} />,
        }}
      />
      {/* Messagerie : retirée de la barre d'onglets, route conservée
          (accessible depuis le tableau de bord). */}
      <Tabs.Screen
        name="messages"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: tr({ fr: "Profil", en: "Profile" }),
          tabBarIcon: ({ color }) => <Icon name="user" size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
