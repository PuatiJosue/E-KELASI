import { View, Text, ScrollView, ActivityIndicator, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { ScreenHeader } from "@/components/ScreenHeader";
import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/Card";
import { Icon } from "@/components/Icon";
import { useTheme, fonts } from "@/lib/theme";
import { T, useT } from "@/lib/i18n";
import { getChild, type Child } from "@/lib/db";

export default function AccountChildren() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const [child, setChild] = useState<Child | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getChild().then((c) => { setChild(c); setReady(true); }).catch(() => setReady(true));
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={["top", "bottom"]}>
      <ScreenHeader title={tr({ fr: "Enfants & écoles", en: "Children & schools" })} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
        {!ready ? (
          <ActivityIndicator color={t.brand} style={{ marginTop: 40 }} />
        ) : !child ? (
          <Text style={{ fontSize: 13.5, color: t.ink3, fontFamily: fonts.body, textAlign: "center", marginTop: 30, lineHeight: 20 }}>
            {tr({
              fr: "Aucun enfant lié. Contactez l'école de votre enfant pour qu'elle vous relie.",
              en: "No child linked. Ask your child's school to link you.",
            })}
          </Text>
        ) : (
          <Card style={{ padding: 16, flexDirection: "row", alignItems: "center", gap: 14 }}>
            <Avatar name={child.name} url={child.avatarUrl} size={52} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: t.ink, fontFamily: fonts.display }}>{child.name}</Text>
              <Text style={{ fontSize: 13, color: t.ink3, marginTop: 2, fontFamily: fonts.body }}>
                {child.grade}{child.school ? ` · ${child.school}` : ""}
              </Text>
            </View>
          </Card>
        )}
        <Pressable
          onPress={() => router.push("/account/register-child")}
          style={{ marginTop: 8, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: t.brand }}
        >
          <Icon name="plus" size={16} color={t.brand} />
          <Text style={{ color: t.brand, fontSize: 14.5, fontWeight: "700", fontFamily: fonts.bodyBold }}>
            {tr({ fr: "Enregistrer un enfant", en: "Register a child" })}
          </Text>
        </Pressable>
        <Text style={{ fontSize: 11.5, color: t.ink3, fontFamily: fonts.body, lineHeight: 17, marginTop: 4 }}>
          <T
            fr="Après enregistrement, l'école valide avant que l'accès soit actif."
            en="After registering, the school validates before access is active."
          />
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
