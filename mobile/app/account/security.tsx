import { View, Text, TextInput, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";

import { ScreenHeader } from "@/components/ScreenHeader";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useTheme, fonts } from "@/lib/theme";
import { useT } from "@/lib/i18n";
import { supabase, isLiveMode } from "@/lib/supabase";
import { codeToPassword, isValidAccessCode, isValidPin } from "@/lib/pin";
import { useLock } from "@/lib/lock";

export default function AccountSecurity() {
  const t = useTheme();
  const tr = useT();
  const { setPin: setLockPin } = useLock();

  // ── Code de connexion (8+ alphanumérique) ──
  const [code, setCode] = useState("");
  const [codeConfirm, setCodeConfirm] = useState("");
  const [busyCode, setBusyCode] = useState(false);
  const [codeMsg, setCodeMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const changeCode = async () => {
    setCodeMsg(null);
    if (!isValidAccessCode(code)) {
      setCodeMsg({ ok: false, text: tr({ fr: "8 caractères min. (lettres et chiffres).", en: "8+ chars (letters and digits)." }) });
      return;
    }
    if (code !== codeConfirm) {
      setCodeMsg({ ok: false, text: tr({ fr: "Les deux codes ne correspondent pas.", en: "Codes don't match." }) });
      return;
    }
    if (!isLiveMode || !supabase) {
      setCodeMsg({ ok: true, text: tr({ fr: "Code modifié.", en: "Code changed." }) });
      return;
    }
    setBusyCode(true);
    const { error } = await supabase.auth.updateUser({ password: codeToPassword(code) });
    setBusyCode(false);
    if (error) {
      setCodeMsg({ ok: false, text: tr({ fr: "Échec. Reconnecte-toi et réessaie.", en: "Failed. Sign in again and retry." }) });
    } else {
      setCode(""); setCodeConfirm("");
      setCodeMsg({ ok: true, text: tr({ fr: "Code de connexion modifié ✅", en: "Login code changed ✅" }) });
    }
  };

  // ── Code du dossier (verrou local, 4 chiffres) ──
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [pinMsg, setPinMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const changePin = async () => {
    setPinMsg(null);
    if (!isValidPin(pin)) {
      setPinMsg({ ok: false, text: tr({ fr: "Le code doit faire 4 chiffres.", en: "Code must be 4 digits." }) });
      return;
    }
    if (pin !== pinConfirm) {
      setPinMsg({ ok: false, text: tr({ fr: "Les deux codes ne correspondent pas.", en: "Codes don't match." }) });
      return;
    }
    await setLockPin(pin);
    setPin(""); setPinConfirm("");
    setPinMsg({ ok: true, text: tr({ fr: "Code du dossier modifié ✅", en: "Dossier code changed ✅" }) });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={["top", "bottom"]}>
      <ScreenHeader title={tr({ fr: "Sécurité du compte", en: "Account security" })} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 18 }}>
        {/* Code de connexion */}
        <Card style={{ padding: 16, gap: 12 }}>
          <View>
            <Text style={{ fontSize: 15, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold }}>
              {tr({ fr: "Code de connexion", en: "Login code" })}
            </Text>
            <Text style={{ fontSize: 12.5, color: t.ink3, fontFamily: fonts.body, marginTop: 2, lineHeight: 18 }}>
              {tr({ fr: "8 caractères minimum, lettres et chiffres. Sert à vous connecter.", en: "At least 8 characters, letters and digits. Used to sign in." })}
            </Text>
          </View>
          <TextField label={tr({ fr: "Nouveau code", en: "New code" })} value={code} onChangeText={(v: string) => setCode(v.replace(/[^A-Za-z0-9]/g, ""))} placeholder="ex. kelasi24" letterSpacing={1} />
          <TextField label={tr({ fr: "Confirmer", en: "Confirm" })} value={codeConfirm} onChangeText={(v: string) => setCodeConfirm(v.replace(/[^A-Za-z0-9]/g, ""))} placeholder="ex. kelasi24" letterSpacing={1} />
          {codeMsg && <Banner ok={codeMsg.ok} text={codeMsg.text} />}
          <Button onPress={changeCode} disabled={busyCode} style={{ paddingVertical: 14, borderRadius: 12, opacity: busyCode ? 0.6 : 1 }}>
            <Text style={{ color: t.onBrand, fontSize: 14.5, fontWeight: "700", fontFamily: fonts.bodyBold }}>
              {busyCode ? tr({ fr: "Modification…", en: "Updating…" }) : tr({ fr: "Changer le code de connexion", en: "Change login code" })}
            </Text>
          </Button>
        </Card>

        {/* Code du dossier (verrou) */}
        <Card style={{ padding: 16, gap: 12 }}>
          <View>
            <Text style={{ fontSize: 15, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold }}>
              {tr({ fr: "Code du dossier (verrou)", en: "Dossier code (lock)" })}
            </Text>
            <Text style={{ fontSize: 12.5, color: t.ink3, fontFamily: fonts.body, marginTop: 2, lineHeight: 18 }}>
              {tr({ fr: "Code à 4 chiffres demandé à l'ouverture pour voir les dossiers de vos enfants.", en: "4-digit code asked at app open to view your children's records." })}
            </Text>
          </View>
          <TextField label={tr({ fr: "Nouveau code", en: "New code" })} value={pin} onChangeText={(v: string) => setPin(v.replace(/\D/g, "").slice(0, 4))} numeric placeholder="••••" letterSpacing={4} />
          <TextField label={tr({ fr: "Confirmer", en: "Confirm" })} value={pinConfirm} onChangeText={(v: string) => setPinConfirm(v.replace(/\D/g, "").slice(0, 4))} numeric placeholder="••••" letterSpacing={4} />
          {pinMsg && <Banner ok={pinMsg.ok} text={pinMsg.text} />}
          <Button onPress={changePin} style={{ paddingVertical: 14, borderRadius: 12 }}>
            <Text style={{ color: t.onBrand, fontSize: 14.5, fontWeight: "700", fontFamily: fonts.bodyBold }}>
              {tr({ fr: "Changer le code du dossier", en: "Change dossier code" })}
            </Text>
          </Button>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function Banner({ ok, text }: { ok: boolean; text: string }) {
  const t = useTheme();
  return (
    <View style={{ padding: 12, borderRadius: 10, backgroundColor: ok ? "rgba(45,134,89,0.10)" : "rgba(192,58,43,0.10)" }}>
      <Text style={{ color: ok ? t.accent : t.danger, fontSize: 12.5, fontWeight: "600", fontFamily: fonts.bodyBold }}>{text}</Text>
    </View>
  );
}

function TextField({
  label,
  numeric,
  letterSpacing = 1,
  ...props
}: { label: string; numeric?: boolean; letterSpacing?: number } & React.ComponentProps<typeof TextInput>) {
  const t = useTheme();
  return (
    <View>
      <Text style={{ fontSize: 12, fontWeight: "600", color: t.ink2, fontFamily: fonts.bodyBold, marginBottom: 6 }}>{label}</Text>
      <TextInput
        {...props}
        secureTextEntry
        autoCapitalize="none"
        keyboardType={numeric ? "number-pad" : "default"}
        maxLength={numeric ? 4 : 32}
        placeholderTextColor={t.ink4}
        style={{
          paddingHorizontal: 12, paddingVertical: 12, borderRadius: 12,
          backgroundColor: t.surface, borderWidth: 1, borderColor: t.borderStrong,
          fontSize: 16, color: t.ink, fontFamily: fonts.body, letterSpacing,
        }}
      />
    </View>
  );
}
