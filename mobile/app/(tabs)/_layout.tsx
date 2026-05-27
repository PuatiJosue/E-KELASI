import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/Icon";
import { useT } from "@/lib/i18n";
import { useTheme, fonts } from "@/lib/theme";

export default function TabsLayout() {
  const t = useTheme();
  const tr = useT();
  const insets = useSafeAreaInsets();

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
        name="messages"
        options={{
          title: tr({ fr: "Messages", en: "Messages" }),
          tabBarIcon: ({ color }) => <Icon name="chat" size={22} color={color} />,
        }}
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
