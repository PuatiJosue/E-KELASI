import { View, Text, Image, ScrollView, ActivityIndicator, Pressable, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";

import { ScreenHeader } from "@/components/ScreenHeader";
import { Card } from "@/components/Card";
import { Icon } from "@/components/Icon";
import { Logo } from "@/components/Logo";
import { useTheme, fonts } from "@/lib/theme";
import { T, useT } from "@/lib/i18n";
import { useChildren } from "@/lib/children";
import { listAnnouncements, listSchoolAnnouncements, type Announcement } from "@/lib/db";

function fmtDate(d: string): string {
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default function Announcements() {
  const t = useTheme();
  const tr = useT();
  const { selectedChild } = useChildren();
  const [items, setItems] = useState<Announcement[] | null>(null);

  // École ciblée depuis « Contact école » (id + nom) ; sinon celle de l'enfant.
  const params = useLocalSearchParams<{ school?: string; name?: string }>();
  const paramSchool = typeof params.school === "string" ? params.school : undefined;
  const paramName = typeof params.name === "string" ? params.name : undefined;

  const schoolId = paramSchool ?? selectedChild?.schoolId ?? null;
  const schoolName = paramName ?? selectedChild?.school;
  // Logo connu seulement pour l'école de l'enfant (l'API écoles n'en renvoie pas).
  const schoolLogo = paramSchool ? undefined : selectedChild?.schoolLogoUrl;

  useEffect(() => {
    if (!schoolId) {
      setItems([]);
      return;
    }
    setItems(null);
    // École ciblée via Contact école → API service-role (contourne la RLS).
    // École de l'enfant → lecture directe (RLS autorisée).
    const fetcher = paramSchool ? listSchoolAnnouncements(schoolId) : listAnnouncements(schoolId);
    fetcher.then(setItems).catch(() => setItems([]));
  }, [schoolId, paramSchool]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={["top", "bottom"]}>
      <ScreenHeader title={tr({ fr: "Annonces de l'école", en: "School announcements" })} />

      {schoolName ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 }}>
          {schoolLogo ? (
            <Image source={{ uri: schoolLogo }} style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: t.surface2 }} resizeMode="contain" />
          ) : (
            <Logo size={32} />
          )}
          <Text style={{ fontSize: 15, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold, flex: 1 }} numberOfLines={1}>
            {schoolName}
          </Text>
        </View>
      ) : null}
      {!items ? (
        <ActivityIndicator color={t.brand} style={{ marginTop: 40 }} />
      ) : items.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 }}>
          <Icon name="bell" size={36} color={t.ink3} />
          <Text style={{ fontSize: 14, color: t.ink3, textAlign: "center", fontFamily: fonts.body, lineHeight: 20 }}>
            {tr({ fr: "Aucune annonce pour le moment.", en: "No announcement yet." })}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
          {items.map((a) => (
            <Card key={a.id} style={{ padding: 16, flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: t.brandSoft, alignItems: "center", justifyContent: "center" }}>
                <Icon name="bell" size={17} color={t.brand600} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 15, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold }}>{a.title}</Text>
                <Text style={{ fontSize: 13.5, color: t.ink2, marginTop: 4, lineHeight: 20, fontFamily: fonts.body }}>{a.body}</Text>
                <Text style={{ fontSize: 11.5, color: t.ink3, marginTop: 8, fontFamily: fonts.body }}>
                  {a.eventDate ? `📅 ${fmtDate(a.eventDate)} · ` : ""}{fmtDate(a.createdAt)}
                </Text>
                {a.attachmentUrl ? (
                  <Pressable
                    onPress={() => Linking.openURL(a.attachmentUrl!)}
                    style={{
                      marginTop: 10, alignSelf: "flex-start",
                      paddingVertical: 7, paddingHorizontal: 12, borderRadius: 8,
                      backgroundColor: t.brandSoft,
                      flexDirection: "row", alignItems: "center", gap: 6,
                    }}
                  >
                    <Icon name="download" size={13} color={t.brand600} />
                    <Text style={{ fontSize: 12, color: t.brand600, fontWeight: "600", fontFamily: fonts.bodyBold }} numberOfLines={1}>
                      {a.attachmentName || tr({ fr: "Ouvrir le document", en: "Open document" })}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            </Card>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
