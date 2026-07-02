// Nouvelle conversation — choix du destinataire + sujet + premier message.

import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";

import { ScreenHeader } from "@/components/ScreenHeader";
import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/Card";
import { Icon } from "@/components/Icon";
import { useTheme, fonts } from "@/lib/theme";
import { T, useT } from "@/lib/i18n";
import { listMessageRecipients, listSchoolRecipients, startConversation, type Recipient } from "@/lib/db";

function roleLabel(role: string, tr: ReturnType<typeof useT>): string {
  if (role === "teacher") return tr({ fr: "Enseignant", en: "Teacher" });
  if (role === "school_admin") return tr({ fr: "Direction", en: "School" });
  if (role === "parent") return tr({ fr: "Parent", en: "Parent" });
  return role;
}

const inputStyle = (t: any): any => ({
  borderWidth: 1, borderColor: t.borderStrong, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
  fontSize: 14, color: t.ink, backgroundColor: t.surface, fontFamily: fonts.body,
});

export default function NewMessage() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  // Depuis « Contact école » : école précise à contacter (id + nom).
  const params = useLocalSearchParams<{ school?: string; name?: string }>();
  const schoolId = typeof params.school === "string" ? params.school : undefined;
  const schoolName = typeof params.name === "string" ? params.name : undefined;

  const [recipients, setRecipients] = useState<Recipient[] | null>(null);
  const [selected, setSelected] = useState<Recipient | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const load = schoolId ? listSchoolRecipients(schoolId) : listMessageRecipients();
    load
      .then((list) => {
        setRecipients(list);
        // Une seule direction possible pour une école ciblée → présélection.
        if (schoolId && list.length === 1) setSelected(list[0]);
      })
      .catch(() => setRecipients([]));
  }, [schoolId]);

  const send = async () => {
    if (!selected) { Alert.alert(tr({ fr: "Destinataire", en: "Recipient" }), tr({ fr: "Choisissez un destinataire.", en: "Pick a recipient." })); return; }
    if (!body.trim()) { Alert.alert(tr({ fr: "Message", en: "Message" }), tr({ fr: "Écrivez un message.", en: "Write a message." })); return; }
    setSending(true);
    const convId = await startConversation(selected.userId, subject.trim() || tr({ fr: "Message", en: "Message" }), body.trim());
    setSending(false);
    if (!convId) { Alert.alert(tr({ fr: "Envoi impossible", en: "Cannot send" }), tr({ fr: "Réessayez plus tard.", en: "Try again later." })); return; }
    router.replace(`/thread/${convId}`);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={["top", "bottom"]}>
      <ScreenHeader title={tr({ fr: "Nouveau message", en: "New message" })} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
          {/* École ciblée (depuis « Contact école ») */}
          {schoolName ? (
            <Card style={{ padding: 12, flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 11, backgroundColor: t.brandSoft, alignItems: "center", justifyContent: "center" }}>
                <Icon name="school" size={20} color={t.brand600} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 11, color: t.ink3, fontWeight: "600", textTransform: "uppercase", fontFamily: fonts.body }}>
                  <T fr="École" en="School" />
                </Text>
                <Text numberOfLines={1} style={{ fontSize: 14.5, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold }}>{schoolName}</Text>
              </View>
            </Card>
          ) : null}

          {/* Destinataire */}
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold }}>
              <T fr="Destinataire" en="Recipient" />
            </Text>
            {recipients === null ? (
              <ActivityIndicator color={t.brand} />
            ) : recipients.length === 0 ? (
              <Card style={{ padding: 18, alignItems: "center" }}>
                <Text style={{ fontSize: 12.5, color: t.ink3, textAlign: "center", fontFamily: fonts.body }}>
                  <T fr="Aucun contact disponible pour l'instant." en="No contact available yet." />
                </Text>
              </Card>
            ) : (
              <View style={{ gap: 8 }}>
                {recipients.map((r) => {
                  const on = selected?.userId === r.userId;
                  return (
                    <Pressable key={r.userId} onPress={() => setSelected(r)}>
                      <Card style={{ padding: 12, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1.5, borderColor: on ? t.brand : "transparent" }}>
                        <Avatar name={r.fullName} size={40} />
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold }}>{r.fullName}</Text>
                          <Text style={{ fontSize: 12, color: t.ink3, fontFamily: fonts.body }}>{roleLabel(r.role, tr)}</Text>
                        </View>
                        {on && <Icon name="check" size={18} color={t.brand} />}
                      </Card>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          {/* Sujet + message */}
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold }}>
              <T fr="Sujet" en="Subject" />
            </Text>
            <TextInput value={subject} onChangeText={setSubject} placeholder={tr({ fr: "Ex. Absence de demain", en: "e.g. Tomorrow's absence" })} placeholderTextColor={t.ink3} style={inputStyle(t)} />
          </View>

          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold }}>
              <T fr="Message" en="Message" />
            </Text>
            <TextInput value={body} onChangeText={setBody} placeholder={tr({ fr: "Votre message…", en: "Your message…" })} placeholderTextColor={t.ink3} multiline style={[inputStyle(t), { minHeight: 110, textAlignVertical: "top" }]} />
          </View>

          <Pressable onPress={send} disabled={sending} style={{ height: 52, borderRadius: 14, backgroundColor: t.brand, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, opacity: sending ? 0.6 : 1 }}>
            <Icon name="send" size={18} color="#fff" />
            <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700", fontFamily: fonts.bodyBold }}>
              {sending ? "…" : tr({ fr: "Envoyer", en: "Send" })}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
