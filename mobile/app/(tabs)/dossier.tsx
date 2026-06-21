// Dossier Enfant — onglet regroupant les enfants & écoles du parent
// (déplacé depuis Profil > « Enfants & écoles »).

import { View, Text, ScrollView, ActivityIndicator, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/Card";
import { Icon } from "@/components/Icon";
import { useTheme, fonts } from "@/lib/theme";
import { T, useT } from "@/lib/i18n";
import { useChildren } from "@/lib/children";

export default function DossierScreen() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const { children, loading } = useChildren();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
          <Text style={{ fontSize: 11, color: t.ink3, fontWeight: "600", letterSpacing: 0.6, textTransform: "uppercase", fontFamily: fonts.body }}>
            <T fr="Mes enfants" en="My children" />
          </Text>
          <Text style={{ fontSize: 26, fontWeight: "700", color: t.ink, fontFamily: fonts.display, letterSpacing: -0.7 }}>
            <T fr="Dossier enfant" en="Child folder" />
          </Text>
        </View>

        <View style={{ paddingHorizontal: 20, gap: 12 }}>
          {loading ? (
            <ActivityIndicator color={t.brand} style={{ marginTop: 40 }} />
          ) : children.length === 0 ? (
            <Text style={{ fontSize: 13.5, color: t.ink3, fontFamily: fonts.body, textAlign: "center", marginTop: 30, lineHeight: 20 }}>
              {tr({
                fr: "Aucun enfant lié. Enregistrez votre enfant ci-dessous ; l'école validera.",
                en: "No child linked. Register your child below; the school will validate.",
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

          <Pressable
            onPress={() => router.push("/account/inscription")}
            style={{ marginTop: 8, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14, backgroundColor: t.brand }}
          >
            <Icon name="school" size={16} color={t.onBrand} />
            <Text style={{ color: t.onBrand, fontSize: 14.5, fontWeight: "700", fontFamily: fonts.bodyBold }}>
              {tr({ fr: "Inscrire un nouvel élève", en: "Enroll a new student" })}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/account/register-child")}
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: t.brand }}
          >
            <Icon name="plus" size={16} color={t.brand} />
            <Text style={{ color: t.brand, fontSize: 14.5, fontWeight: "700", fontFamily: fonts.bodyBold }}>
              {tr({ fr: "Enregistrement rapide", en: "Quick register" })}
            </Text>
          </Pressable>

          {children.length > 0 && (
            <Pressable
              onPress={() => router.push("/account/reenroll")}
              style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14, backgroundColor: t.brand }}
            >
              <Icon name="school" size={16} color={t.onBrand} />
              <Text style={{ color: t.onBrand, fontSize: 14.5, fontWeight: "700", fontFamily: fonts.bodyBold }}>
                {tr({ fr: "Demander une réinscription", en: "Request re-enrollment" })}
              </Text>
            </Pressable>
          )}

          <Text style={{ fontSize: 11.5, color: t.ink3, fontFamily: fonts.body, lineHeight: 17, marginTop: 4 }}>
            <T
              fr="Après enregistrement, l'école valide avant que l'accès soit actif."
              en="After registering, the school validates before access is active."
            />
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
