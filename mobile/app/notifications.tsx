import { View, Text, ScrollView, Pressable, ActivityIndicator, Linking, RefreshControl, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";

import { Card } from "@/components/Card";
import { Icon } from "@/components/Icon";
import { useTheme, fonts } from "@/lib/theme";
import { T } from "@/lib/i18n";
import { type Notification } from "@/lib/mock";
import { listNotifications } from "@/lib/db";

const ICON_BY_KIND: Record<Notification["kind"], string> = {
  grade: "award",
  message: "chat",
  hw: "book",
  school: "school",
  reminder: "flag",
};

export default function NotificationsScreen() {
  const t = useTheme();
  const router = useRouter();
  const [notifs, setNotifs] = useState<Notification[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<Notification | null>(null);

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
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20, gap: 8 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.brand} />}
        >
          {notifs.map((n, i) => (
            <Pressable key={i} onPress={() => setSelected(n)}>
              <Card style={{ padding: 14, flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: colorByKind[n.kind] + "22", alignItems: "center", justifyContent: "center" }}>
                  <Icon name={ICON_BY_KIND[n.kind]} size={16} color={colorByKind[n.kind]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={2} style={{ fontSize: 13.5, color: t.ink, fontWeight: "500", fontFamily: fonts.body }}>{n.text}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
                    <Text style={{ fontSize: 11, color: t.ink3, fontFamily: fonts.body }}>{n.time}</Text>
                    {n.fileUrl ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                        <Icon name="download" size={11} color={t.brand600} />
                        <Text style={{ fontSize: 11, color: t.brand600, fontFamily: fonts.bodyBold }}>
                          <T fr="Pièce jointe" en="Attachment" />
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
                <Icon name="chevR" size={16} color={t.ink3} />
              </Card>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Détail d'une notification : ouvre le texte complet + pièce jointe. */}
      <Modal visible={selected !== null} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <Pressable onPress={() => setSelected(null)} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}>
          <Pressable onPress={(e) => e.stopPropagation()} style={{ backgroundColor: t.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 22, paddingBottom: 34, gap: 14 }}>
            {selected && (
              <>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: colorByKind[selected.kind] + "22", alignItems: "center", justifyContent: "center" }}>
                    <Icon name={ICON_BY_KIND[selected.kind]} size={18} color={colorByKind[selected.kind]} />
                  </View>
                  <Text style={{ flex: 1, fontSize: 12, color: t.ink3, fontFamily: fonts.body }}>{selected.time}</Text>
                  <Pressable onPress={() => setSelected(null)} style={{ padding: 4 }}>
                    <Icon name="close" size={20} color={t.ink2} />
                  </Pressable>
                </View>

                <Text style={{ fontSize: 15, color: t.ink, lineHeight: 22, fontFamily: fonts.body }}>{selected.text}</Text>

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
    </SafeAreaView>
  );
}
