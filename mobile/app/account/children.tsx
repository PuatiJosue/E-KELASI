import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";

import { ScreenHeader } from "@/components/ScreenHeader";
import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/Card";
import { useTheme, fonts } from "@/lib/theme";
import { T, useT } from "@/lib/i18n";
import { getChild, type Child } from "@/lib/db";

export default function AccountChildren() {
  const t = useTheme();
  const tr = useT();
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
        <Text style={{ fontSize: 11.5, color: t.ink3, fontFamily: fonts.body, lineHeight: 17, marginTop: 4 }}>
          <T
            fr="L'ajout ou le retrait d'un enfant est géré par l'école."
            en="Adding or removing a child is managed by the school."
          />
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
