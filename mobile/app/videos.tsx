// Vidéos des cours — liens partagés par l'école pour la classe de l'enfant.

import { View, Text, ScrollView, Pressable, ActivityIndicator, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";

import { ScreenHeader } from "@/components/ScreenHeader";
import { Card } from "@/components/Card";
import { Icon } from "@/components/Icon";
import { useTheme, fonts } from "@/lib/theme";
import { T, useT } from "@/lib/i18n";
import { useChildren } from "@/lib/children";
import { listCourseVideos, listPlatformVideos, type CourseVideoItem } from "@/lib/db";

export default function Videos() {
  const t = useTheme();
  const tr = useT();
  const { selectedChild } = useChildren();
  const [videos, setVideos] = useState<CourseVideoItem[] | null>(null);

  useEffect(() => {
    setVideos(null);
    Promise.all([
      selectedChild ? listCourseVideos(selectedChild.schoolId, selectedChild.grade) : Promise.resolve([]),
      listPlatformVideos(),
    ])
      .then(([school, platform]) => setVideos([...platform, ...school]))
      .catch(() => setVideos([]));
  }, [selectedChild?.id]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={["top", "bottom"]}>
      <ScreenHeader title={tr({ fr: "Vidéos des cours", en: "Course videos" })} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
        {videos === null ? (
          <ActivityIndicator color={t.brand} style={{ marginTop: 30 }} />
        ) : videos.length === 0 ? (
          <Card style={{ padding: 26, alignItems: "center", gap: 8 }}>
            <Icon name="image" size={30} color={t.ink3} />
            <Text style={{ fontSize: 13, color: t.ink3, textAlign: "center", fontFamily: fonts.body }}>
              <T fr="Aucune vidéo partagée par l'école pour l'instant." en="No video shared by the school yet." />
            </Text>
          </Card>
        ) : (
          videos.map((v) => (
            <Pressable key={v.id} onPress={() => Linking.openURL(v.url).catch(() => {})}>
              <Card style={{ padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 46, height: 46, borderRadius: 13, backgroundColor: "#EC48991F", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="image" size={22} color="#EC4899" />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={2} style={{ fontSize: 14, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold }}>{v.title}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3, flexWrap: "wrap" }}>
                    {v.platform && (
                      <View style={{ backgroundColor: t.brandSoft, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 }}>
                        <Text style={{ fontSize: 10, fontWeight: "800", color: t.brand600, fontFamily: fonts.body }}>E-KLASS</Text>
                      </View>
                    )}
                    <Text style={{ fontSize: 12, color: t.ink3, fontFamily: fonts.body }}>
                      {[v.subject, v.className].filter(Boolean).join(" · ") || tr({ fr: v.platform ? "Vidéo E-KLASS" : "Toutes les classes", en: v.platform ? "E-KLASS video" : "All classes" })}
                    </Text>
                  </View>
                </View>
                <Icon name="chevR" size={20} color={t.ink4} />
              </Card>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
