// Onglet « Enfants » — liste des enfants + accès rapide (Résultats, Devoirs, Dossier).

import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";

import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/Card";
import { Icon } from "@/components/Icon";
import { AddMenu } from "@/components/AddMenu";
import { useTheme, fonts } from "@/lib/theme";
import { T, useT } from "@/lib/i18n";
import { useChildren } from "@/lib/children";
import { type Child } from "@/lib/db";
import { pickAndUploadChildPhoto } from "@/lib/studentPhoto";

export default function EnfantsTab() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const { children, loading, selectChild, refresh } = useChildren();
  const [uploadingChild, setUploadingChild] = useState<string | null>(null);

  const go = (c: Child, route: string) => {
    selectChild(c.id);
    router.push(route as any);
  };

  const onPickChildPhoto = async (childId: string) => {
    if (uploadingChild) return;
    setUploadingChild(childId);
    const res = await pickAndUploadChildPhoto(childId);
    setUploadingChild(null);
    if (res.ok) refresh();
    else if (res.error !== "Annulé.") Alert.alert("Photo", res.error);
  };

  const ACTIONS: { icon: string; color: string; fr: string; en: string; route: string }[] = [
    { icon: "chart", color: "#16A34A", fr: "Résultats", en: "Results", route: "/(tabs)/grades" },
    { icon: "book", color: "#F59E0B", fr: "Devoirs", en: "Homework", route: "/(tabs)/homework" },
    { icon: "file", color: "#4F66E8", fr: "Dossier", en: "Folder", route: "/(tabs)/dossier" },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={["top"]}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 22, fontFamily: fonts.display, fontWeight: "700", color: t.ink }}>
          <T fr="Mes enfants" en="My children" />
        </Text>
        <AddMenu />
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={t.brand} />
        </View>
      ) : children.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 10 }}>
          <Icon name="user" size={38} color={t.ink3} />
          <Text style={{ fontSize: 14, color: t.ink3, textAlign: "center", fontFamily: fonts.body }}>
            <T fr="Aucun enfant enregistré." en="No child registered." />
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 14 }}>
          {children.map((c) => (
            <Card key={c.id} style={{ padding: 14, gap: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Pressable onPress={() => onPickChildPhoto(c.id)} disabled={uploadingChild === c.id} style={{ opacity: uploadingChild === c.id ? 0.6 : 1 }}>
                  <Avatar name={c.name} url={c.avatarUrl} size={46} />
                  <View style={{ position: "absolute", bottom: -2, right: -2, width: 21, height: 21, borderRadius: 11, backgroundColor: t.brand, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: t.surface }}>
                    <Icon name="camera" size={11} color="#fff" />
                  </View>
                  {uploadingChild === c.id && <ActivityIndicator size="small" color={t.brand} style={{ position: "absolute", top: 14, left: 14 }} />}
                </Pressable>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold }}>{c.name}</Text>
                  <Text numberOfLines={1} style={{ fontSize: 12, color: t.ink3, marginTop: 1, fontFamily: fonts.body }}>
                    {[c.grade, c.option, c.school].filter(Boolean).join(" · ")}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {ACTIONS.map((a) => (
                  <Pressable key={a.fr} onPress={() => go(c, a.route)} style={{ flex: 1 }}>
                    <View style={{ alignItems: "center", gap: 5, paddingVertical: 10, borderRadius: 12, backgroundColor: t.surface2 }}>
                      <Icon name={a.icon} size={18} color={a.color} />
                      <Text style={{ fontSize: 11, fontWeight: "600", color: t.ink2, fontFamily: fonts.body }}>
                        <T fr={a.fr} en={a.en} />
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </Card>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
