import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import { Card } from "@/components/Card";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { useTheme, fonts } from "@/lib/theme";
import { T, useT } from "@/lib/i18n";
import { listThreads, type Thread } from "@/lib/db";

export default function Messages() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const [threads, setThreads] = useState<Thread[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setThreads(await listThreads());
    } catch {
      setThreads([]);
    }
  }, []);

  // Recharge à chaque retour sur l'onglet (nouvelle réponse de l'école, etc.).
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.brand} />}
      >
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View>
            <Text style={{ fontSize: 11, color: t.ink3, fontWeight: "600", letterSpacing: 0.6, textTransform: "uppercase", fontFamily: fonts.body }}>
              <T fr="Conversations" en="Conversations" />
            </Text>
            <Text style={{ fontSize: 26, fontWeight: "700", color: t.ink, fontFamily: fonts.display, letterSpacing: -0.7 }}>
              <T fr="Messagerie" en="Inbox" />
            </Text>
          </View>
          <Pressable onPress={() => router.push("/message-new")} style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: t.brand, alignItems: "center", justifyContent: "center" }}>
            <Icon name="edit" size={17} color="white" />
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 20, paddingVertical: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: t.surface2 }}>
            <Icon name="search" size={16} color={t.ink3} />
            <Text style={{ color: t.ink3, fontSize: 13.5, fontFamily: fonts.body }}>
              {tr({ fr: "Rechercher un professeur, un sujet…", en: "Search a teacher, a subject…" })}
            </Text>
          </View>
        </View>

        {threads === null ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <ActivityIndicator color={t.brand} />
          </View>
        ) : threads.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 28, paddingHorizontal: 24, gap: 14 }}>
            <Icon name="chat" size={34} color={t.ink3} />
            <Text style={{ textAlign: "center", color: t.ink3, fontSize: 13, fontFamily: fonts.body }}>
              <T fr="Aucune conversation. Écrivez à un enseignant ou à la direction." en="No conversations. Message a teacher or the school." />
            </Text>
            <Pressable onPress={() => router.push("/message-new")} style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: t.brand, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 }}>
              <Icon name="edit" size={16} color="#fff" />
              <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700", fontFamily: fonts.bodyBold }}>
                <T fr="Nouveau message" en="New message" />
              </Text>
            </Pressable>
          </View>
        ) : (
          <Card style={{ marginHorizontal: 20, padding: 4 }}>
            {threads.map((th, i) => (
              <Pressable
                key={th.id}
                onPress={() => router.push(`/thread/${th.id}`)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  padding: 12,
                  borderBottomWidth: i < threads.length - 1 ? 1 : 0,
                  borderBottomColor: t.divider,
                }}
              >
                <Avatar name={th.from} size={40} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                    <Text style={{ fontSize: 13.5, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold }}>{th.from}</Text>
                    <Text style={{ fontSize: 11, color: t.ink3, marginLeft: 6, fontFamily: fonts.body }}> · {th.subject}</Text>
                    <Text style={{ marginLeft: "auto", fontSize: 11, color: t.ink3, fontFamily: fonts.body }}>{th.time}</Text>
                  </View>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 12.5,
                      color: th.unread ? t.ink : t.ink3,
                      fontWeight: th.unread ? "600" : "400",
                      marginTop: 2,
                      fontFamily: th.unread ? fonts.bodyBold : fonts.body,
                    }}
                  >
                    {th.preview}
                  </Text>
                </View>
                {th.unread && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.brand }} />}
              </Pressable>
            ))}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
