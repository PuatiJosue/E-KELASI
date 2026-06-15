// Sélecteur horizontal d'enfant — affiché quand le parent a plus d'un enfant.
// Tap sur un enfant → l'écran courant suit cet enfant.

import { View, Text, ScrollView, Pressable } from "react-native";
import { Avatar } from "@/components/Avatar";
import { useTheme, fonts } from "@/lib/theme";
import { useChildren } from "@/lib/children";

export function ChildSwitcher({ style }: { style?: any }) {
  const t = useTheme();
  const { children, selectedId, selectChild } = useChildren();

  // Inutile d'afficher un sélecteur s'il n'y a qu'un seul enfant.
  if (children.length < 2) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
      style={style}
    >
      {children.map((c) => {
        const on = c.id === selectedId;
        const firstName = c.name.split(" ").slice(-1)[0] || c.name;
        return (
          <Pressable
            key={c.id}
            onPress={() => selectChild(c.id)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              paddingVertical: 6,
              paddingHorizontal: 8,
              paddingRight: 14,
              borderRadius: 999,
              backgroundColor: on ? t.brand : t.surface,
              borderWidth: 1,
              borderColor: on ? t.brand : t.border,
            }}
          >
            <Avatar name={c.name} url={c.avatarUrl} size={28} />
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: on ? t.onBrand : t.ink2,
                fontFamily: fonts.bodyBold,
              }}
            >
              {firstName}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
