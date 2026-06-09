// Welcome screen — shown when no session. Triggers demo or live sign-in.

import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";

import { Logo } from "@/components/Logo";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useTheme, fonts } from "@/lib/theme";
import { T, useT } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";

export default function Welcome() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const { session } = useAuth();
  const [busy, setBusy] = useState(false);

  // If user is already signed in, jump to tabs immediately.
  if (session) {
    router.replace("/(tabs)");
    return null;
  }

  const goSignup = () => router.push("/signup");
  const haveAccount = () => router.push("/login");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
        <View style={{ flex: 1, padding: 24, paddingBottom: 0 }}>
          <Logo size={44} withWord />

          <View style={{ marginTop: 56 }}>
            <Text
              style={{
                fontFamily: fonts.display,
                fontWeight: "700",
                fontSize: 38,
                lineHeight: 40,
                color: t.ink,
                letterSpacing: -1.3,
              }}
            >
              <T fr="Suivez la réussite de votre enfant, " en="Follow your child's school journey, " />
              <Text style={{ color: t.brand }}>
                <T fr="au quotidien." en="every day." />
              </Text>
            </Text>
            <Text style={{ marginTop: 18, fontSize: 16, lineHeight: 24, color: t.ink2, fontFamily: fonts.body }}>
              <T
                fr="Notes, devoirs, messages des professeurs — toute la vie scolaire dans une app pensée pour les parents."
                en="Grades, homework, teacher messages — your child's school life in one app, built for parents."
              />
            </Text>
          </View>

          {/* preview card */}
          <Card style={{ marginTop: "auto", marginBottom: 18, padding: 16, flexDirection: "row", alignItems: "center", gap: 14 }}>
            <View style={{ position: "relative" }}>
              <Avatar name="Amina Diallo" size={46} />
              <View
                style={{
                  position: "absolute",
                  bottom: -2,
                  right: -2,
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: t.accent,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 2,
                  borderColor: t.surface,
                }}
              >
                <Icon name="check" size={11} color="white" />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold }}>
                {tr({ fr: "Nouvelle note en Mathématiques", en: "New grade in Mathematics" })}
              </Text>
              <Text style={{ fontSize: 12, color: t.ink3, marginTop: 2, fontFamily: fonts.body }}>
                {tr({ fr: "Amina a obtenu 17/20", en: "Amina scored 17/20" })} · 12 min
              </Text>
            </View>
          </Card>
        </View>

        <View style={{ paddingHorizontal: 24, paddingBottom: 12, gap: 10 }}>
          <Button onPress={goSignup} disabled={busy} style={{ paddingVertical: 16, borderRadius: 14 }}>
            <Text style={{ color: t.onBrand, fontSize: 15.5, fontWeight: "700", fontFamily: fonts.bodyBold }}>
              {tr({ fr: "S'inscrire", en: "Sign up" })}
            </Text>
          </Button>
          <Button variant="ghost" onPress={haveAccount} disabled={busy}>
            <Text style={{ color: t.ink2, fontSize: 14, fontWeight: "600", fontFamily: fonts.body }}>
              {tr({ fr: "J'ai déjà un compte", en: "I already have an account" })}
            </Text>
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
