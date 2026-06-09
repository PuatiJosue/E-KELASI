// Signup parent — création de compte + sélection enfant/école.
// MVP : email, password, nom complet, code école (fourni par l'école), nom de l'enfant.
// Modèle B2B : le parent crée son compte ; l'accès est ensuite géré par l'école.

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
import { supabase, isLiveMode } from "@/lib/supabase";
import { pinToPassword, isValidPin } from "@/lib/pin";

export default function Signup() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const { signInDemo } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canSubmit = email && isValidPin(password) && fullName;

  const onSubmit = async () => {
    setError(null);
    setSuccess(null);

    if (!isLiveMode || !supabase) {
      // En mode démo on simule juste l'inscription.
      setBusy(true);
      setTimeout(() => {
        signInDemo();
        router.replace("/(tabs)");
      }, 500);
      return;
    }

    setBusy(true);
    try {
      if (!isValidPin(password)) {
        setError(tr({ fr: "Le code doit faire 4 chiffres.", en: "PIN must be 4 digits." }));
        setBusy(false);
        return;
      }
      const { data, error: signErr } = await supabase.auth.signUp({
        email: email.trim(),
        password: pinToPassword(password),
        options: {
          data: { full_name: fullName, phone: phone || null },
        },
      });
      if (signErr) {
        setError(signErr.message);
        setBusy(false);
        return;
      }
      if (!data.user) {
        setError(tr({ fr: "Erreur inconnue", en: "Unknown error" }));
        setBusy(false);
        return;
      }

      // Crée le profil parent côté DB (avec le service role on devrait, mais
      // on peut le faire côté client avec RLS puisque c'est son propre id).
      const { error: profileErr } = await supabase.from("profiles").upsert({
        id: data.user.id,
        email: email.trim(),
        full_name: fullName,
        role: "parent",
        locale: "fr",
        phone: phone || null,
      });
      if (profileErr) {
        console.warn("profile upsert failed:", profileErr.message);
      }

      // Si Supabase est configuré en "email confirmations required",
      // l'utilisateur recevra un mail. Sinon il est connecté direct.
      if (data.session) {
        setSuccess(tr({ fr: "Compte créé !", en: "Account created!" }));
        // Modèle B2B : pas de paiement parent → direct à l'accueil.
        setTimeout(() => router.replace("/(tabs)"), 400);
      } else {
        setSuccess(
          tr({
            fr: "Vérifie ton email pour confirmer ton compte.",
            en: "Check your email to confirm your account.",
          })
        );
        setBusy(false);
      }
    } catch (e: any) {
      setError(e?.message ?? "Erreur réseau");
      setBusy(false);
    }
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

          <View style={{ marginTop: 28 }}>
            <Text style={{ fontFamily: fonts.display, fontSize: 26, fontWeight: "700", color: t.ink, letterSpacing: -0.5 }}>
              <T fr="Créer un compte" en="Create an account" />
            </Text>
            <Text style={{ fontSize: 14, color: t.ink3, marginTop: 6, lineHeight: 20, fontFamily: fonts.body }}>
              <T
                fr="Créez votre compte pour suivre la scolarité de votre enfant. L'accès est géré par l'école."
                en="Create your account to follow your child's school journey. Access is managed by the school."
              />
            </Text>
          </View>

          <View style={{ marginTop: 24, gap: 14 }}>
            <Field
              label={tr({ fr: "Nom complet", en: "Full name" })}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Fatou Diallo"
              autoCapitalize="words"
              autoComplete="name"
              icon="user"
            />
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
              label={tr({ fr: "Téléphone (optionnel)", en: "Phone (optional)" })}
              value={phone}
              onChangeText={setPhone}
              placeholder="+221 77 123 45 67"
              keyboardType="phone-pad"
              autoComplete="tel"
              icon="bell"
            />
            <Field
              label={tr({ fr: "Code à 4 chiffres", en: "4-digit PIN" })}
              value={password}
              onChangeText={(v) => setPassword(v.replace(/\D/g, "").slice(0, 4))}
              placeholder="••••"
              secureTextEntry
              keyboardType="number-pad"
              maxLength={4}
              autoComplete="off"
              icon="lock"
            />
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
          {success && (
            <View
              style={{
                marginTop: 16,
                padding: 12,
                borderRadius: 10,
                backgroundColor: "rgba(45,134,89,0.10)",
              }}
            >
              <Text style={{ color: t.accent, fontSize: 12.5, fontWeight: "600", fontFamily: fonts.bodyBold }}>{success}</Text>
            </View>
          )}

          <Button
            onPress={onSubmit}
            disabled={busy || !canSubmit}
            style={{ marginTop: 24, paddingVertical: 16, borderRadius: 14, opacity: busy || !canSubmit ? 0.6 : 1 }}
          >
            <Text style={{ color: t.onBrand, fontSize: 15.5, fontWeight: "700", fontFamily: fonts.bodyBold }}>
              {busy ? tr({ fr: "Création…", en: "Creating…" }) : tr({ fr: "Créer mon compte", en: "Create account" })}
            </Text>
          </Button>

          <Text style={{ marginTop: 14, textAlign: "center", fontSize: 11, color: t.ink3, fontFamily: fonts.body, lineHeight: 16 }}>
            <T
              fr="En créant un compte tu acceptes nos CGU et notre politique de confidentialité."
              en="By creating an account you accept our terms and privacy policy."
            />
          </Text>

          <Pressable onPress={() => router.replace("/login")} style={{ marginTop: 18, alignItems: "center" }}>
            <Text style={{ fontSize: 13, color: t.ink3, fontFamily: fonts.body }}>
              <T fr="J'ai déjà un compte → " en="I already have an account → " />
              <Text style={{ color: t.brand600, fontFamily: fonts.bodyBold }}>
                <T fr="Se connecter" en="Sign in" />
              </Text>
            </Text>
          </Pressable>
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
