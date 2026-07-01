// Onglet « Contact école » — coordonnées de l'école de l'enfant sélectionné.

import { View, Text, ScrollView, Pressable, Linking, Alert, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { Card } from "@/components/Card";
import { Icon } from "@/components/Icon";
import { useTheme, fonts, radii } from "@/lib/theme";
import { T, useT } from "@/lib/i18n";
import { useChildren } from "@/lib/children";

export default function ContactTab() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const { selectedChild } = useChildren();

  const schoolName = selectedChild?.school ?? tr({ fr: "Votre école", en: "Your school" });
  const phone = selectedChild?.schoolPhone ?? null;
  const logo = selectedChild?.schoolLogoUrl ?? null;

  const call = () => {
    if (!phone) return;
    Linking.openURL(`tel:${phone.replace(/\s/g, "")}`).catch(() =>
      Alert.alert(tr({ fr: "Appel impossible", en: "Cannot call" }), phone)
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={["top"]}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 22, fontFamily: fonts.display, fontWeight: "700", color: t.ink }}>
          <T fr="Contact école" en="School contact" />
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 14 }}>
        {/* En-tête école */}
        <Card style={{ padding: 18, alignItems: "center", gap: 10 }}>
          <View style={{ width: 68, height: 68, borderRadius: radii.lg, backgroundColor: t.brandSoft, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            {logo ? (
              <Image source={{ uri: logo }} style={{ width: 68, height: 68 }} resizeMode="cover" />
            ) : (
              <Icon name="school" size={30} color={t.brand600} />
            )}
          </View>
          <Text style={{ fontSize: 17, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold, textAlign: "center" }}>{schoolName}</Text>
          <Text style={{ fontSize: 12.5, color: t.ink3, fontFamily: fonts.body, textAlign: "center" }}>
            <T fr="Contactez l'école de votre enfant" en="Contact your child's school" />
          </Text>
        </Card>

        {/* Appeler */}
        <Pressable onPress={phone ? call : undefined} disabled={!phone}>
          <Card style={{ padding: 14, flexDirection: "row", alignItems: "center", gap: 14, opacity: phone ? 1 : 0.55 }}>
            <View style={{ width: 46, height: 46, borderRadius: 13, backgroundColor: "#16A34A1F", alignItems: "center", justifyContent: "center" }}>
              <Icon name="phone" size={22} color="#16A34A" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 14.5, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold }}>
                <T fr="Appeler l'école" en="Call the school" />
              </Text>
              <Text style={{ fontSize: 12.5, color: t.ink3, marginTop: 1, fontFamily: fonts.body }}>
                {phone ?? tr({ fr: "Numéro non renseigné", en: "No number provided" })}
              </Text>
            </View>
            {phone && <Icon name="chevR" size={20} color={t.ink4} />}
          </Card>
        </Pressable>

        {/* Messagerie */}
        <Pressable onPress={() => router.push("/message-new" as any)}>
          <Card style={{ padding: 14, flexDirection: "row", alignItems: "center", gap: 14 }}>
            <View style={{ width: 46, height: 46, borderRadius: 13, backgroundColor: "#8B5CF61F", alignItems: "center", justifyContent: "center" }}>
              <Icon name="chat" size={22} color="#8B5CF6" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 14.5, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold }}>
                <T fr="Envoyer un message" en="Send a message" />
              </Text>
              <Text style={{ fontSize: 12.5, color: t.ink3, marginTop: 1, fontFamily: fonts.body }}>
                <T fr="Écrire à l'enseignant ou à la direction" en="Message a teacher or the school" />
              </Text>
            </View>
            <Icon name="chevR" size={20} color={t.ink4} />
          </Card>
        </Pressable>

        {/* Annonces */}
        <Pressable onPress={() => router.push("/announcements" as any)}>
          <Card style={{ padding: 14, flexDirection: "row", alignItems: "center", gap: 14 }}>
            <View style={{ width: 46, height: 46, borderRadius: 13, backgroundColor: "#4F66E81F", alignItems: "center", justifyContent: "center" }}>
              <Icon name="bell" size={22} color="#4F66E8" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 14.5, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold }}>
                <T fr="Annonces de l'école" en="School announcements" />
              </Text>
              <Text style={{ fontSize: 12.5, color: t.ink3, marginTop: 1, fontFamily: fonts.body }}>
                <T fr="Infos et événements" en="News and events" />
              </Text>
            </View>
            <Icon name="chevR" size={20} color={t.ink4} />
          </Card>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
