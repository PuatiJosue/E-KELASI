// Espace numérique — hub : Bibliothèque + Vidéos des cours.

import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { ScreenHeader } from "@/components/ScreenHeader";
import { Card } from "@/components/Card";
import { Icon } from "@/components/Icon";
import { useTheme, fonts } from "@/lib/theme";
import { T, useT } from "@/lib/i18n";

export default function EspaceNumerique() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();

  const FOLDERS: { key: string; icon: string; color: string; fr: string; en: string; subFr: string; subEn: string; onPress: () => void }[] = [
    {
      key: "library",
      icon: "book",
      color: "#4F66E8",
      fr: "Bibliothèque",
      en: "Library",
      subFr: "Livres et manuels de l'école",
      subEn: "School books and manuals",
      onPress: () => router.push("/(tabs)/library" as any),
    },
    {
      key: "videos",
      icon: "image",
      color: "#EC4899",
      fr: "Vidéos des cours",
      en: "Course videos",
      subFr: "Cours filmés et supports vidéo",
      subEn: "Recorded lessons and video content",
      onPress: () => router.push("/videos" as any),
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={["top", "bottom"]}>
      <ScreenHeader title={tr({ fr: "Espace numérique", en: "Digital space" })} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
        <Text style={{ fontSize: 13, color: t.ink3, fontFamily: fonts.body, lineHeight: 20 }}>
          <T fr="Accédez aux ressources numériques de l'école." en="Access the school's digital resources." />
        </Text>

        {FOLDERS.map((f) => (
          <Pressable key={f.key} onPress={f.onPress}>
            <Card style={{ padding: 16, flexDirection: "row", alignItems: "center", gap: 14 }}>
              <View style={{ width: 52, height: 52, borderRadius: 15, backgroundColor: f.color + "1F", alignItems: "center", justifyContent: "center" }}>
                <Icon name={f.icon} size={24} color={f.color} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 15.5, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold }}>
                  <T fr={f.fr} en={f.en} />
                </Text>
                <Text style={{ fontSize: 12.5, color: t.ink3, marginTop: 2, fontFamily: fonts.body }}>
                  <T fr={f.subFr} en={f.subEn} />
                </Text>
              </View>
              <Icon name="chevR" size={20} color={t.ink4} />
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
