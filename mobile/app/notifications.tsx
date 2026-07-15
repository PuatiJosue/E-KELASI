import { View, Text, ScrollView, Pressable, ActivityIndicator, Linking, RefreshControl, Modal, useWindowDimensions } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Card } from "@/components/Card";
import { Icon } from "@/components/Icon";
import { useTheme, fonts } from "@/lib/theme";
import { T } from "@/lib/i18n";
import { type Notification } from "@/lib/mock";
import { listNotifications, deleteNotification } from "@/lib/db";

const ICON_BY_KIND: Record<Notification["kind"], string> = {
  grade: "award",
  message: "chat",
  hw: "book",
  school: "school",
  reminder: "flag",
};

const MONTHS_FR = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

// En-tête de jour, ex. « 04 juillet 2025 ».
function dayLabel(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`;
}

export default function NotificationsScreen() {
  const t = useTheme();
  const router = useRouter();
  // Android dessine sous la barre de navigation (edge-to-edge, imposé depuis
  // SDK 54) et une Modal n'hérite pas des insets du SafeAreaView : sans ça le
  // bas des sheets passe derrière la barre et le texte est coupé.
  const insets = useSafeAreaInsets();
  const { height: winH } = useWindowDimensions();
  const sheetPadBottom = Math.max(34, insets.bottom + 16);
  const [notifs, setNotifs] = useState<Notification[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<Notification | null>(null);
  const [menuFor, setMenuFor] = useState<Notification | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await listNotifications();
      setNotifs(data);
    } catch {
      setNotifs([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const colorByKind: Record<Notification["kind"], string> = {
    grade: t.accent,
    message: t.info,
    hw: t.brand,
    school: t.ink2,
    reminder: t.warning,
  };

  // Regroupe les notifications par jour, en conservant l'ordre (récent → ancien).
  const groups = useMemo(() => {
    const out: { key: string; label: string; items: Notification[] }[] = [];
    for (const n of notifs ?? []) {
      const d = new Date(n.date);
      const key = isNaN(d.getTime()) ? n.date : `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      let g = out.find((x) => x.key === key);
      if (!g) { g = { key, label: dayLabel(n.date), items: [] }; out.push(g); }
      g.items.push(n);
    }
    return out;
  }, [notifs]);

  // Suppression optimiste : retire de la liste puis efface en base.
  const remove = async (n: Notification) => {
    setMenuFor(null);
    setNotifs((prev) => (prev ?? []).filter((x) => x.id !== n.id));
    await deleteNotification(n.id);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={["top", "bottom"]}>
      <View style={{ paddingVertical: 8, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Pressable onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" }}>
          <Icon name="chevL" size={20} color={t.ink2} />
        </Pressable>
        <Text style={{ flex: 1, fontSize: 17, fontWeight: "700", color: t.ink, fontFamily: fonts.display }}>
          <T fr="Notifications" en="Notifications" />
        </Text>
        <Pressable onPress={onRefresh}>
          <Icon name="refresh" size={18} color={t.brand600} />
        </Pressable>
      </View>

      {notifs === null ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={t.brand} />
        </View>
      ) : notifs.length === 0 ? (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, alignItems: "center", justifyContent: "center", padding: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.brand} />}
        >
          <Text style={{ color: t.ink3, fontSize: 13, fontFamily: fonts.body, textAlign: "center" }}>
            <T fr="Aucune notification. Tirez vers le bas pour actualiser." en="No notifications. Pull down to refresh." />
          </Text>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.brand} />}
        >
          {groups.map((g) => (
            <View key={g.key} style={{ marginTop: 14 }}>
              <Text style={{ fontSize: 12, color: t.ink3, fontWeight: "700", fontFamily: fonts.bodyBold, marginBottom: 8, marginLeft: 2 }}>
                {g.label}
              </Text>
              <View style={{ gap: 8 }}>
                {g.items.map((n) => (
                  <Pressable key={n.id} onPress={() => setSelected(n)}>
                    <Card style={{ padding: 14, flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: colorByKind[n.kind] + "22", alignItems: "center", justifyContent: "center" }}>
                        <Icon name={ICON_BY_KIND[n.kind]} size={16} color={colorByKind[n.kind]} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text numberOfLines={2} style={{ fontSize: 13.5, color: t.ink, fontWeight: "500", fontFamily: fonts.body }}>{n.text}</Text>
                        {n.fileUrl ? (
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 3, marginTop: 4 }}>
                            <Icon name="download" size={11} color={t.brand600} />
                            <Text style={{ fontSize: 11, color: t.brand600, fontFamily: fonts.bodyBold }}>
                              <T fr="Pièce jointe" en="Attachment" />
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <View style={{ alignItems: "flex-end", gap: 8 }}>
                        <Text style={{ fontSize: 11, color: t.ink3, fontFamily: fonts.body }}>{n.time}</Text>
                        <Pressable
                          onPress={() => setMenuFor(n)}
                          hitSlop={8}
                          style={{ padding: 2 }}
                        >
                          <Icon name="dots" size={18} color={t.ink3} />
                        </Pressable>
                      </View>
                    </Card>
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Détail d'une notification : ouvre le texte complet + pièce jointe. */}
      <Modal visible={selected !== null} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <Pressable onPress={() => setSelected(null)} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}>
          <Pressable onPress={(e) => e.stopPropagation()} style={{ backgroundColor: t.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 22, paddingBottom: sheetPadBottom, gap: 14, maxHeight: winH * 0.8 }}>
            {selected && (
              <>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: colorByKind[selected.kind] + "22", alignItems: "center", justifyContent: "center" }}>
                    <Icon name={ICON_BY_KIND[selected.kind]} size={18} color={colorByKind[selected.kind]} />
                  </View>
                  <Text style={{ flex: 1, fontSize: 12, color: t.ink3, fontFamily: fonts.body }}>{dayLabel(selected.date)} · {selected.time}</Text>
                  <Pressable onPress={() => setSelected(null)} style={{ padding: 4 }}>
                    <Icon name="close" size={20} color={t.ink2} />
                  </Pressable>
                </View>

                {/* Défilable : une annonce longue dépasserait sinon l'écran. */}
                <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ paddingBottom: 2 }}>
                  <Text style={{ fontSize: 15, color: t.ink, lineHeight: 22, fontFamily: fonts.body }}>{selected.text}</Text>
                </ScrollView>

                {selected.fileUrl ? (
                  <Pressable
                    onPress={() => Linking.openURL(selected.fileUrl!)}
                    style={{ marginTop: 4, alignSelf: "flex-start", paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, backgroundColor: t.brand, flexDirection: "row", alignItems: "center", gap: 8 }}
                  >
                    <Icon name="download" size={15} color={t.onBrand} />
                    <Text style={{ fontSize: 14, color: t.onBrand, fontWeight: "700", fontFamily: fonts.bodyBold }}>
                      <T fr="Ouvrir la pièce jointe" en="Open attachment" />
                    </Text>
                  </Pressable>
                ) : null}
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Menu « … » d'une notification : supprimer. */}
      <Modal visible={menuFor !== null} transparent animationType="fade" onRequestClose={() => setMenuFor(null)}>
        <Pressable onPress={() => setMenuFor(null)} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}>
          <Pressable onPress={(e) => e.stopPropagation()} style={{ backgroundColor: t.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 12, paddingBottom: sheetPadBottom }}>
            <Pressable
              onPress={() => menuFor && remove(menuFor)}
              style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 16, paddingHorizontal: 12 }}
            >
              <Icon name="trash" size={18} color={t.danger} />
              <Text style={{ fontSize: 15, color: t.danger, fontWeight: "600", fontFamily: fonts.bodyBold }}>
                <T fr="Supprimer" en="Delete" />
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setMenuFor(null)}
              style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 16, paddingHorizontal: 12 }}
            >
              <Icon name="close" size={18} color={t.ink2} />
              <Text style={{ fontSize: 15, color: t.ink2, fontWeight: "600", fontFamily: fonts.bodyBold }}>
                <T fr="Annuler" en="Cancel" />
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
