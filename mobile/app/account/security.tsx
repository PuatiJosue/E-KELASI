import { View, Text, TextInput, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";

import { ScreenHeader } from "@/components/ScreenHeader";
import { Button } from "@/components/Button";
import { useTheme, fonts } from "@/lib/theme";
import { useT } from "@/lib/i18n";
import { supabase, isLiveMode } from "@/lib/supabase";
import { pinToPassword, isValidPin } from "@/lib/pin";

export default function AccountSecurity() {
  const t = useTheme();
  const tr = useT();
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const change = async () => {
    setMsg(null);
    if (!isValidPin(pin)) {
      setMsg({ ok: false, text: tr({ fr: "Le code doit faire 4 chiffres.", en: "PIN must be 4 digits." }) });
      return;
    }
    if (pin !== confirm) {
      setMsg({ ok: false, text: tr({ fr: "Les deux codes ne correspondent pas.", en: "PINs don't match." }) });
      return;
    }
    if (!isLiveMode || !supabase) {
      setMsg({ ok: true, text: tr({ fr: "Code modifié.", en: "PIN changed." }) });
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pinToPassword(pin) });
    setBusy(false);
    if (error) {
      setMsg({ ok: false, text: tr({ fr: "Échec. Reconnecte-toi et réessaie.", en: "Failed. Sign in again and retry." }) });
    } else {
      setPin(""); setConfirm("");
      setMsg({ ok: true, text: tr({ fr: "Code PIN modifié ✅", en: "PIN changed ✅" }) });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={["top", "bottom"]}>
      <ScreenHeader title={tr({ fr: "Sécurité du compte", en: "Account security" })} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
        <Text style={{ fontSize: 13.5, color: t.ink2, fontFamily: fonts.body, lineHeight: 20 }}>
          {tr({ fr: "Choisis un nouveau code PIN à 4 chiffres.", en: "Choose a new 4-digit PIN." })}
        </Text>
        <Field label={tr({ fr: "Nouveau code", en: "New PIN" })} value={pin} onChangeText={(v: string) => setPin(v.replace(/\D/g, "").slice(0, 4))} />
        <Field label={tr({ fr: "Confirmer le code", en: "Confirm PIN" })} value={confirm} onChangeText={(v: string) => setConfirm(v.replace(/\D/g, "").slice(0, 4))} />

        {msg && (
          <View style={{ padding: 12, borderRadius: 10, backgroundColor: msg.ok ? "rgba(45,134,89,0.10)" : "rgba(192,58,43,0.10)" }}>
            <Text style={{ color: msg.ok ? t.accent : t.danger, fontSize: 12.5, fontWeight: "600", fontFamily: fonts.bodyBold }}>{msg.text}</Text>
          </View>
        )}

        <Button onPress={change} disabled={busy} style={{ marginTop: 6, paddingVertical: 15, borderRadius: 14, opacity: busy ? 0.6 : 1 }}>
          <Text style={{ color: t.onBrand, fontSize: 15, fontWeight: "700", fontFamily: fonts.bodyBold }}>
            {busy ? tr({ fr: "Modification…", en: "Updating…" }) : tr({ fr: "Changer le code", en: "Change PIN" })}
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
        secureTextEntry
        keyboardType="number-pad"
        maxLength={4}
        placeholder="••••"
        placeholderTextColor={t.ink4}
        style={{
          paddingHorizontal: 12, paddingVertical: 12, borderRadius: 12,
          backgroundColor: t.surface, borderWidth: 1, borderColor: t.borderStrong,
          fontSize: 16, color: t.ink, fontFamily: fonts.body, letterSpacing: 4,
        }}
      />
    </View>
  );
}
