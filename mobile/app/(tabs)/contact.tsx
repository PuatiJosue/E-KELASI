// Onglet « Contact école » — choix de l'école (toutes les écoles) puis
// affichage du nom de l'école et du nom du directeur (informatif).

import { View, Text, ScrollView, Pressable, Modal, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";

import { Card } from "@/components/Card";
import { Icon } from "@/components/Icon";
import { useTheme, fonts } from "@/lib/theme";
import { T, useT } from "@/lib/i18n";
import { useChildren } from "@/lib/children";

const WEB_API = process.env.EXPO_PUBLIC_WEB_API_URL ?? "";

type School = { id: string; name: string; city?: string | null; director_name?: string | null };

export default function ContactTab() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const { selectedChild } = useChildren();

  const [schools, setSchools] = useState<School[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Charge toutes les écoles de la base.
  useEffect(() => {
    fetch(`${WEB_API}/api/schools/search`)
      .then((r) => r.json())
      .then((d) => setSchools(d?.schools ?? []))
      .catch(() => setSchools([]));
  }, []);

  // Sélection par défaut : l'école de l'enfant sélectionné, si présente.
  useEffect(() => {
    if (!schools || selectedId) return;
    const match = selectedChild?.school ? schools.find((s) => s.name === selectedChild.school) : null;
    setSelectedId(match?.id ?? null);
  }, [schools, selectedChild?.school]);

  const selected = useMemo(() => (schools ?? []).find((s) => s.id === selectedId) ?? null, [schools, selectedId]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={["top"]}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 22, fontFamily: fonts.display, fontWeight: "700", color: t.ink }}>
          <T fr="Contact école" en="School contact" />
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 14 }}>
        {/* Sélecteur d'école */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: "700", color: t.ink2, fontFamily: fonts.bodyBold }}>
            <T fr="École" en="School" />
          </Text>
          <Pressable
            onPress={() => setPickerOpen(true)}
            style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: t.borderStrong, backgroundColor: t.surface }}
          >
            <View style={{ width: 40, height: 40, borderRadius: 11, backgroundColor: t.brandSoft, alignItems: "center", justifyContent: "center" }}>
              <Icon name="school" size={20} color={t.brand600} />
            </View>
            <Text style={{ flex: 1, fontSize: 14.5, fontWeight: "600", color: selected ? t.ink : t.ink3, fontFamily: fonts.body }}>
              {selected?.name ?? tr({ fr: "Choisir une école", en: "Choose a school" })}
            </Text>
            <Icon name="chevD" size={18} color={t.ink3} />
          </Pressable>
        </View>

        {/* Infos de l'école sélectionnée : nom + directeur (informatif). */}
        {selected && (
          <Card style={{ padding: 18, gap: 14 }}>
            <View style={{ gap: 3 }}>
              <Text style={{ fontSize: 11, color: t.ink3, fontWeight: "600", letterSpacing: 0.4, textTransform: "uppercase", fontFamily: fonts.body }}>
                <T fr="Nom de l'école" en="School name" />
              </Text>
              <Text style={{ fontSize: 16, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold }}>{selected.name}</Text>
            </View>
            <View style={{ height: 1, backgroundColor: t.divider }} />
            <View style={{ gap: 3 }}>
              <Text style={{ fontSize: 11, color: t.ink3, fontWeight: "600", letterSpacing: 0.4, textTransform: "uppercase", fontFamily: fonts.body }}>
                <T fr="Directeur" en="Head teacher" />
              </Text>
              {/* Nom du directeur : informatif, non cliquable. */}
              <Text style={{ fontSize: 15, fontWeight: "600", color: t.ink, fontFamily: fonts.body }}>
                {selected.director_name?.trim() || tr({ fr: "Non renseigné", en: "Not provided" })}
              </Text>
            </View>
          </Card>
        )}

        {/* Actions */}
        <Pressable onPress={() => router.push((selected ? `/message-new?school=${selected.id}&name=${encodeURIComponent(selected.name)}` : "/message-new") as any)}>
          <Card style={{ padding: 14, flexDirection: "row", alignItems: "center", gap: 14 }}>
            <View style={{ width: 46, height: 46, borderRadius: 13, backgroundColor: "#8B5CF61F", alignItems: "center", justifyContent: "center" }}>
              <Icon name="chat" size={22} color="#8B5CF6" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 14.5, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold }}>
                <T fr="Envoyer un message" en="Send a message" />
              </Text>
              <Text style={{ fontSize: 12.5, color: t.ink3, marginTop: 1, fontFamily: fonts.body }}>
                <T fr="Écrire à la direction" en="Message the school" />
              </Text>
            </View>
            <Icon name="chevR" size={20} color={t.ink4} />
          </Card>
        </Pressable>

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

      {/* Menu déroulant des écoles */}
      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <Pressable onPress={() => setPickerOpen(false)} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}>
          <Pressable onPress={() => {}} style={{ backgroundColor: t.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingTop: 12, paddingBottom: 30, maxHeight: "70%" }}>
            <View style={{ alignItems: "center", marginBottom: 8 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: t.border }} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: "700", color: t.ink, fontFamily: fonts.display, paddingHorizontal: 20, marginBottom: 8 }}>
              <T fr="Choisir une école" en="Choose a school" />
            </Text>
            {schools === null ? (
              <ActivityIndicator color={t.brand} style={{ marginVertical: 24 }} />
            ) : schools.length === 0 ? (
              <Text style={{ fontSize: 13, color: t.ink3, textAlign: "center", padding: 24, fontFamily: fonts.body }}>
                <T fr="Aucune école disponible." en="No school available." />
              </Text>
            ) : (
              <ScrollView>
                {schools.map((s) => {
                  const on = s.id === selectedId;
                  return (
                    <Pressable
                      key={s.id}
                      onPress={() => { setSelectedId(s.id); setPickerOpen(false); }}
                      style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, paddingHorizontal: 20, backgroundColor: on ? t.brandSoft : "transparent" }}
                    >
                      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: t.surface2, alignItems: "center", justifyContent: "center" }}>
                        <Icon name="school" size={17} color={t.brand600} />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold }}>{s.name}</Text>
                        {s.city ? <Text style={{ fontSize: 12, color: t.ink3, fontFamily: fonts.body }}>{s.city}</Text> : null}
                      </View>
                      {on && <Icon name="check" size={18} color={t.brand} />}
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
