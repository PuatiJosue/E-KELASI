// Overlay de verrouillage — couvre toute l'app quand le parent est connecté et
// doit (1) créer son code de dossier à 4 chiffres, ou (2) le saisir à l'ouverture.

import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";

import { Logo } from "@/components/Logo";
import { Icon } from "@/components/Icon";
import { useTheme, fonts } from "@/lib/theme";
import { useT } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useLock } from "@/lib/lock";
import { isValidPin } from "@/lib/pin";

export function LockOverlay() {
  const t = useTheme();
  const tr = useT();
  const { session } = useAuth();
  const { loading, hasPin, locked, setPin, unlock } = useLock();

  const [code, setCode] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Pas connecté → aucun verrou (les écrans de connexion restent visibles).
  if (!session) return null;

  // Chargement de l'état du verrou → overlay neutre (évite de montrer l'app).
  if (loading) {
    return (
      <View style={[fill, { backgroundColor: t.bg, alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator color={t.brand} />
      </View>
    );
  }

  // Déverrouillé et code déjà défini → rien à afficher.
  if (hasPin && !locked) return null;

  const creating = !hasPin; // pas encore de code → mode création

  const onSubmit = async () => {
    setError(null);
    if (!isValidPin(code)) {
      setError(tr({ fr: "Le code doit faire 4 chiffres.", en: "Code must be 4 digits." }));
      return;
    }
    if (creating) {
      if (code !== confirm) {
        setError(tr({ fr: "Les deux codes ne correspondent pas.", en: "Codes don't match." }));
        return;
      }
      setBusy(true);
      await setPin(code);
      setBusy(false);
      setCode(""); setConfirm("");
      return;
    }
    setBusy(true);
    const ok = await unlock(code);
    setBusy(false);
    if (!ok) {
      setError(tr({ fr: "Code incorrect.", en: "Incorrect code." }));
      setCode("");
      return;
    }
    setCode("");
  };

  return (
    <View style={[fill, { backgroundColor: t.bg }]}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View style={{ flex: 1, padding: 28, justifyContent: "center", gap: 18 }}>
          <View style={{ alignItems: "center", gap: 16 }}>
            <Logo size={40} />
            <View
              style={{
                width: 64, height: 64, borderRadius: 20, backgroundColor: t.brandSoft,
                alignItems: "center", justifyContent: "center",
              }}
            >
              <Icon name="lock" size={28} color={t.brand600} />
            </View>
            <Text style={{ fontSize: 22, fontWeight: "700", color: t.ink, fontFamily: fonts.display, textAlign: "center" }}>
              {creating
                ? tr({ fr: "Protégez le dossier", en: "Protect the records" })
                : tr({ fr: "Code du dossier", en: "Dossier code" })}
            </Text>
            <Text style={{ fontSize: 13.5, color: t.ink3, fontFamily: fonts.body, textAlign: "center", lineHeight: 20, maxWidth: 300 }}>
              {creating
                ? tr({
                    fr: "Choisissez un code à 4 chiffres. Il sera demandé à chaque ouverture pour accéder aux dossiers de vos enfants.",
                    en: "Choose a 4-digit code. It will be asked each time you open the app to access your children's records.",
                  })
                : tr({
                    fr: "Saisissez votre code à 4 chiffres pour accéder aux dossiers de vos enfants.",
                    en: "Enter your 4-digit code to access your children's records.",
                  })}
            </Text>
          </View>

          <View style={{ gap: 12, marginTop: 4 }}>
            <CodeField
              value={code}
              onChangeText={(v: string) => setCode(v.replace(/\D/g, "").slice(0, 4))}
              autoFocus
            />
            {creating && (
              <CodeField
                value={confirm}
                onChangeText={(v: string) => setConfirm(v.replace(/\D/g, "").slice(0, 4))}
                placeholder="••••"
              />
            )}
          </View>

          {error && (
            <Text style={{ color: t.danger, fontSize: 13, fontWeight: "600", fontFamily: fonts.bodyBold, textAlign: "center" }}>
              {error}
            </Text>
          )}

          <Pressable
            onPress={onSubmit}
            disabled={busy}
            style={{ backgroundColor: t.brand, paddingVertical: 16, borderRadius: 14, alignItems: "center", opacity: busy ? 0.6 : 1 }}
          >
            <Text style={{ color: t.onBrand, fontSize: 15.5, fontWeight: "700", fontFamily: fonts.bodyBold }}>
              {creating
                ? tr({ fr: "Définir le code", en: "Set code" })
                : tr({ fr: "Déverrouiller", en: "Unlock" })}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const fill = { position: "absolute" as const, top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 };

function CodeField({ ...props }: React.ComponentProps<typeof TextInput>) {
  const t = useTheme();
  return (
    <TextInput
      {...props}
      secureTextEntry
      keyboardType="number-pad"
      maxLength={4}
      placeholder={props.placeholder ?? "••••"}
      placeholderTextColor={t.ink4}
      style={{
        paddingVertical: 16,
        borderRadius: 14,
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.borderStrong,
        fontSize: 24,
        color: t.ink,
        fontFamily: fonts.body,
        letterSpacing: 12,
        textAlign: "center",
      }}
    />
  );
}
