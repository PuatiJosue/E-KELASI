// Real email/password login (vs the demo button on Welcome).

import { View, Text, TextInput, ScrollView, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";

import { Logo } from "@/components/Logo";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/Button";
import { useTheme, fonts } from "@/lib/theme";
import { T, useT } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { codeToPassword, isValidAccessCode } from "@/lib/pin";

export default function Login() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    if (!isValidAccessCode(password)) {
      setError(tr({ fr: "Le code doit faire 8 caractères (lettres et chiffres).", en: "Code must be 8+ characters (letters and digits)." }));
      return;
    }
    setBusy(true);
    const res = await signIn(email.trim(), codeToPassword(password));
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? tr({ fr: "Email ou code incorrect.", en: "Incorrect email or PIN." }));
      return;
    }
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }} keyboardShouldPersistTaps="handled">
          <Pressable
            onPress={() => router.back()}
            style={{ marginBottom: 16, width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" }}
          >
            <Icon name="chevL" size={22} color={t.ink2} />
          </Pressable>

          <Logo size={36} withWord />

          <View style={{ marginTop: 32 }}>
            <Text style={{ fontFamily: fonts.display, fontSize: 26, fontWeight: "700", color: t.ink, letterSpacing: -0.5 }}>
              <T fr="Bon retour 👋" en="Welcome back 👋" />
            </Text>
            <Text style={{ fontSize: 14, color: t.ink3, marginTop: 6, lineHeight: 20, fontFamily: fonts.body }}>
              <T
                fr="Connectez-vous pour suivre la scolarité de votre enfant."
                en="Sign in to keep up with your child's school journey."
              />
            </Text>
          </View>

          <View style={{ marginTop: 28, gap: 14 }}>
            <Field
              label={tr({ fr: "Email", en: "Email" })}
              value={email}
              onChangeText={setEmail}
              placeholder="parent@exemple.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              icon="mail"
            />
            <Field
              label={tr({ fr: "Code de connexion", en: "Login code" })}
              value={password}
              onChangeText={(v) => setPassword(v.replace(/[^A-Za-z0-9]/g, ""))}
              placeholder="8 caractères min."
              secureTextEntry
              autoCapitalize="none"
              autoComplete="off"
              icon="lock"
            />
            <Pressable style={{ alignSelf: "flex-end", marginTop: -4 }}>
              <Text style={{ fontSize: 12.5, color: t.brand600, fontWeight: "600", fontFamily: fonts.bodyBold }}>
                <T fr="Mot de passe oublié ?" en="Forgot password?" />
              </Text>
            </Pressable>
          </View>

          {error && (
            <View
              style={{
                marginTop: 16,
                padding: 12,
                borderRadius: 10,
                backgroundColor: "rgba(192,58,43,0.10)",
              }}
            >
              <Text style={{ color: t.danger, fontSize: 12.5, fontWeight: "600", fontFamily: fonts.bodyBold }}>{error}</Text>
            </View>
          )}

          <Button
            onPress={onSubmit}
            disabled={busy || !email || !isValidAccessCode(password)}
            style={{ marginTop: 24, paddingVertical: 16, borderRadius: 14, opacity: busy ? 0.6 : 1 }}
          >
            <Text style={{ color: t.onBrand, fontSize: 15.5, fontWeight: "700", fontFamily: fonts.bodyBold }}>
              {busy ? tr({ fr: "Connexion…", en: "Signing in…" }) : tr({ fr: "Se connecter", en: "Sign in" })}
            </Text>
          </Button>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  icon,
  ...inputProps
}: {
  label: string;
  icon?: string;
} & React.ComponentProps<typeof TextInput>) {
  const t = useTheme();
  return (
    <View>
      <Text style={{ fontSize: 12, fontWeight: "600", color: t.ink2, fontFamily: fonts.bodyBold, marginBottom: 6 }}>
        {label}
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          paddingHorizontal: 12,
          paddingVertical: 12,
          borderRadius: 12,
          backgroundColor: t.surface,
          borderWidth: 1,
          borderColor: t.borderStrong,
        }}
      >
        {icon && <Icon name={icon} size={16} color={t.ink3} />}
        <TextInput
          {...inputProps}
          placeholderTextColor={t.ink4}
          style={{ flex: 1, fontSize: 14, color: t.ink, fontFamily: fonts.body, padding: 0 }}
        />
      </View>
    </View>
  );
}
