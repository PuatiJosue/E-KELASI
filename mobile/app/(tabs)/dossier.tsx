// Dossier Enfant — onglet regroupant les enfants & écoles du parent
// (déplacé depuis Profil > « Enfants & écoles »).

import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/Card";
import { AddMenu } from "@/components/AddMenu";
import { useTheme, fonts } from "@/lib/theme";
import { T, useT } from "@/lib/i18n";
import { useChildren } from "@/lib/children";

export default function DossierScreen() {
  const t = useTheme();
  const tr = useT();
  const { children, loading } = useChildren();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View>
            <Text style={{ fontSize: 11, color: t.ink3, fontWeight: "600", letterSpacing: 0.6, textTransform: "uppercase", fontFamily: fonts.body }}>
              <T fr="Mes enfants" en="My children" />
            </Text>
            <Text style={{ fontSize: 26, fontWeight: "700", color: t.ink, fontFamily: fonts.display, letterSpacing: -0.7 }}>
              <T fr="Dossier enfant" en="Child folder" />
            </Text>
          </View>
          <AddMenu />
        </View>

        <View style={{ paddingHorizontal: 20, gap: 12 }}>
          {loading ? (
            <ActivityIndicator color={t.brand} style={{ marginTop: 40 }} />
          ) : children.length === 0 ? (
            <Text style={{ fontSize: 13.5, color: t.ink3, fontFamily: fonts.body, textAlign: "center", marginTop: 30, lineHeight: 20 }}>
              {tr({
                fr: "Aucun enfant lié. Utilisez le bouton « + » en haut à droite pour enregistrer votre enfant ; l'école validera.",
                en: "No child linked. Use the « + » button (top right) to register your child; the school will validate.",
              })}
            </Text>
          ) : (
            children.map((child) => (
              <Card key={child.id} style={{ padding: 16, flexDirection: "row", alignItems: "center", gap: 14 }}>
                <Avatar name={child.name} url={child.avatarUrl} size={52} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: t.ink, fontFamily: fonts.display }}>{child.name}</Text>
                  <Text style={{ fontSize: 13, color: t.ink3, marginTop: 2, fontFamily: fonts.body }}>
                    {[child.grade, child.option, child.school].filter(Boolean).join(" · ")}
                  </Text>
                </View>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
