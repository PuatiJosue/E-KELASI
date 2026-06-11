import { View, Text, TextInput, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";

import { ScreenHeader } from "@/components/ScreenHeader";
import { Button } from "@/components/Button";
import { useTheme, fonts } from "@/lib/theme";
import { T, useT } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { supabase, isLiveMode } from "@/lib/supabase";

export default function AccountInfo() {
  const t = useTheme();
  const tr = useT();
  const { session } = useAuth();

  const [fullName, setFullName] = useState(session?.fullName ?? "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!isLiveMode || !supabase || !session?.userId) return;
    supabase
      .from("profiles")
      .select("phone, address")
      .eq("id", session.userId)
      .maybeSingle()
      .then(({ data }) => {
        setPhone(data?.phone ?? "");
        setAddress(data?.address ?? "");
      });
  }, [session?.userId]);

  const save = async () => {
    setMsg(null);
    if (!fullName.trim()) {
      setMsg({ ok: false, text: tr({ fr: "Le nom est obligatoire.", en: "Name is required." }) });
      return;
    }
    if (!isLiveMode || !supabase || !session?.userId) {
      setMsg({ ok: true, text: tr({ fr: "Enregistré.", en: "Saved." }) });
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim(), phone: phone.trim() || null, address: address.trim() || null })
      .eq("id", session.userId);
    await supabase.auth.updateUser({ data: { full_name: fullName.trim() } }).catch(() => {});
    setBusy(false);
    setMsg(
      error
        ? { ok: false, text: tr({ fr: "Échec de l'enregistrement.", en: "Save failed." }) }
        : { ok: true, text: tr({ fr: "Profil mis à jour ✅", en: "Profile updated ✅" }) }
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={["top", "bottom"]}>
      <ScreenHeader title={tr({ fr: "Informations personnelles", en: "Personal info" })} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
        <Field label={tr({ fr: "Nom complet", en: "Full name" })} value={fullName} onChangeText={setFullName} />
        <Field label={tr({ fr: "Téléphone", en: "Phone" })} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Field label={tr({ fr: "Adresse du domicile", en: "Home address" })} value={address} onChangeText={setAddress} placeholder="Commune, quartier, avenue…" />
        <View>
          <Text style={{ fontSize: 12, fontWeight: "600", color: t.ink2, fontFamily: fonts.bodyBold, marginBottom: 6 }}>Email</Text>
          <Text style={{ fontSize: 14, color: t.ink3, fontFamily: fonts.body }}>{session?.email ?? "—"}</Text>
        </View>

        {msg && (
          <View style={{ padding: 12, borderRadius: 10, backgroundColor: msg.ok ? "rgba(45,134,89,0.10)" : "rgba(192,58,43,0.10)" }}>
            <Text style={{ color: msg.ok ? t.accent : t.danger, fontSize: 12.5, fontWeight: "600", fontFamily: fonts.bodyBold }}>{msg.text}</Text>
          </View>
        )}

        <Button onPress={save} disabled={busy} style={{ marginTop: 6, paddingVertical: 15, borderRadius: 14, opacity: busy ? 0.6 : 1 }}>
          <Text style={{ color: t.onBrand, fontSize: 15, fontWeight: "700", fontFamily: fonts.bodyBold }}>
            {busy ? tr({ fr: "Enregistrement…", en: "Saving…" }) : tr({ fr: "Enregistrer", en: "Save" })}
          </Text>
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  const t = useTheme();
  return (
    <View>
      <Text style={{ fontSize: 12, fontWeight: "600", color: t.ink2, fontFamily: fonts.bodyBold, marginBottom: 6 }}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor={t.ink4}
        style={{
          paddingHorizontal: 12, paddingVertical: 12, borderRadius: 12,
          backgroundColor: t.surface, borderWidth: 1, borderColor: t.borderStrong,
          fontSize: 14, color: t.ink, fontFamily: fonts.body,
        }}
      />
    </View>
  );
}
