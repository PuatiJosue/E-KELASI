import { View, Text, ScrollView, Pressable, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { useTheme, fonts } from "@/lib/theme";
import { T, useT } from "@/lib/i18n";
import { getThread, sendMessage, subscribeToConversation, type ThreadMessage } from "@/lib/db";

type ThreadData = {
  title: string;
  subtitle: string;
  messages: ThreadMessage[];
};

export default function Thread() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<ThreadData | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const d = await getThread(String(id));
      setData(d);
    } catch {
      setData({ title: "", subtitle: "", messages: [] });
    }
  }, [id]);

  // Chargement + abonnement temps réel (nouveaux messages instantanés).
  useEffect(() => {
    if (!id) return;
    load();
    const unsub = subscribeToConversation(String(id), load);
    return unsub;
  }, [id, load]);

  // Recharge à chaque fois qu'on revient sur l'écran (filet de sécurité).
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const onSend = async () => {
    const body = draft.trim();
    if (!body || !id) return;
    setSending(true);
    const result = await sendMessage(String(id), body);
    setSending(false);
    if (result) {
      setDraft("");
      setData((d) => (d ? { ...d, messages: [...d.messages, result] } : d));
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={0}>
        <View
          style={{
            paddingVertical: 8,
            paddingHorizontal: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            borderBottomWidth: 1,
            borderBottomColor: t.divider,
            backgroundColor: t.surface,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{ width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" }}
          >
            <Icon name="chevL" size={20} color={t.ink2} />
          </Pressable>
          <Avatar name={data?.title ?? "?"} size={36} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold }}>{data?.title ?? "…"}</Text>
            <Text style={{ fontSize: 11, color: t.ink3, fontFamily: fonts.body }}>{data?.subtitle ?? ""}</Text>
          </View>
        </View>

        {data === null ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator color={t.brand} />
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={{ padding: 16, gap: 10 }}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.brand} />}
          >
            <DayDivider label={{ fr: "Aujourd'hui", en: "Today" }} />
            {data.messages.map((m) => (
              <Bubble key={m.id} who={m.fromMe ? "me" : "them"}>
                <Text style={{ color: m.fromMe ? "white" : t.ink, fontSize: 13.5, lineHeight: 19, fontFamily: fonts.body }}>
                  {m.body}
                </Text>
                <Text style={{ fontSize: 10, color: m.fromMe ? "rgba(255,255,255,0.7)" : t.ink3, marginTop: 4, fontFamily: fonts.body }}>
                  {m.createdAt}
                </Text>
              </Bubble>
            ))}
            {data.messages.length === 0 && (
              <Text style={{ textAlign: "center", color: t.ink3, fontSize: 13, fontFamily: fonts.body }}>
                <T fr="Aucun message." en="No messages." />
              </Text>
            )}
          </ScrollView>
        )}

        <View
          style={{
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderTopWidth: 1,
            borderTopColor: t.divider,
            backgroundColor: t.surface,
            flexDirection: "row",
            alignItems: "flex-end",
            gap: 8,
          }}
        >
          <Pressable style={{ width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" }}>
            <Icon name="plus" size={20} color={t.ink3} />
          </Pressable>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={tr({ fr: "Écrire un message…", en: "Type a message…" })}
            placeholderTextColor={t.ink3}
            multiline
            style={{
              flex: 1,
              maxHeight: 100,
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 20,
              backgroundColor: t.surface2,
              fontSize: 13.5,
              color: t.ink,
              fontFamily: fonts.body,
              minHeight: 40,
            }}
          />
          <Pressable
            onPress={onSend}
            disabled={!draft.trim() || sending}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: draft.trim() ? t.brand : t.surface3,
              alignItems: "center",
              justifyContent: "center",
              opacity: sending ? 0.6 : 1,
            }}
          >
            {sending ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Icon name="send" size={16} color="white" />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function DayDivider({ label }: { label: { fr: string; en: string } }) {
  const t = useTheme();
  return (
    <View style={{ alignItems: "center", marginVertical: 4 }}>
      <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: t.surface2 }}>
        <Text style={{ fontSize: 10.5, color: t.ink3, fontWeight: "600", letterSpacing: 0.4, textTransform: "uppercase", fontFamily: fonts.bodyBold }}>
          <T fr={label.fr} en={label.en} />
        </Text>
      </View>
    </View>
  );
}

function Bubble({ who, children }: { who: "me" | "them"; children: React.ReactNode }) {
  const t = useTheme();
  const me = who === "me";
  return (
    <View style={{ flexDirection: "row", justifyContent: me ? "flex-end" : "flex-start" }}>
      <View
        style={{
          maxWidth: "78%",
          paddingHorizontal: 13,
          paddingVertical: 10,
          borderRadius: 16,
          borderBottomRightRadius: me ? 4 : 16,
          borderBottomLeftRadius: me ? 16 : 4,
          backgroundColor: me ? t.brand : t.surface,
          borderWidth: me ? 0 : 1,
          borderColor: t.border,
        }}
      >
        {children}
      </View>
    </View>
  );
}
