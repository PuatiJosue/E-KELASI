// Écran de choix de plan + Stripe PaymentSheet.
// Le parent choisit Essentiel/Famille/Premium, on POST sur /api/stripe/create-subscription
// (qui retourne client_secret), on ouvre la PaymentSheet, et après succès on revient.

import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useStripe } from "@stripe/stripe-react-native";

import { Card } from "@/components/Card";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/Button";
import { MobileMoneySheet } from "@/components/MobileMoneySheet";
import { useTheme, fonts, radii } from "@/lib/theme";
import { T, useT } from "@/lib/i18n";
import { PLANS, type PlanId } from "@/lib/plans";
import { supabase, isLiveMode } from "@/lib/supabase";

const WEB_API_URL = process.env.EXPO_PUBLIC_WEB_API_URL ?? "http://192.168.1.77:3000";

export default function Subscribe() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [selected, setSelected] = useState<PlanId>("famille");
  const [busy, setBusy] = useState(false);
  const [mmOpen, setMmOpen] = useState(false);

  const currentPlan = PLANS.find((p) => p.id === selected)!;

  const subscribe = async () => {
    const plan = PLANS.find((p) => p.id === selected);
    if (!plan) return;

    if (!isLiveMode || !supabase) {
      Alert.alert(
        tr({ fr: "Mode démo", en: "Demo mode" }),
        tr({ fr: "Le paiement n'est pas disponible en démo.", en: "Payment unavailable in demo." })
      );
      return;
    }

    if (!plan.stripePriceId) {
      Alert.alert(
        "Stripe non configuré",
        "Configurez EXPO_PUBLIC_STRIPE_PRICE_* dans .env.local"
      );
      return;
    }

    setBusy(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${WEB_API_URL}/api/stripe/create-subscription`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: session ? `Bearer ${session.access_token}` : "",
        },
        body: JSON.stringify({ priceId: plan.stripePriceId, plan: plan.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "create-subscription failed");

      const { error: initErr } = await initPaymentSheet({
        merchantDisplayName: "E-KELASI",
        paymentIntentClientSecret: json.clientSecret,
        customerId: json.customerId,
        allowsDelayedPaymentMethods: false,
        returnURL: "ekelasi://stripe-redirect",
      });
      if (initErr) throw new Error(initErr.message);

      const { error: payErr } = await presentPaymentSheet();
      if (payErr) {
        if (payErr.code !== "Canceled") {
          Alert.alert(tr({ fr: "Échec du paiement", en: "Payment failed" }), payErr.message);
        }
      } else {
        Alert.alert(
          tr({ fr: "Bienvenue !", en: "Welcome!" }),
          tr({ fr: "Votre essai gratuit a démarré.", en: "Your free trial has started." })
        );
        router.replace("/(tabs)/profile");
      }
    } catch (e: any) {
      Alert.alert("Erreur", e?.message ?? "unknown");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }}>
        <Pressable
          onPress={() => router.back()}
          style={{ width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 16 }}
        >
          <Icon name="chevL" size={22} color={t.ink2} />
        </Pressable>

        <Text style={{ fontFamily: fonts.display, fontSize: 26, fontWeight: "700", color: t.ink, letterSpacing: -0.5 }}>
          <T fr="Choisis ton plan" en="Pick your plan" />
        </Text>
        <Text style={{ fontSize: 14, color: t.ink3, marginTop: 6, lineHeight: 20, fontFamily: fonts.body }}>
          <T
            fr="Essai gratuit 14 jours, annulable à tout moment depuis ton profil."
            en="Free 14-day trial, cancel anytime from your profile."
          />
        </Text>

        <View style={{ marginTop: 24, gap: 12 }}>
          {PLANS.map((plan) => {
            const on = selected === plan.id;
            return (
              <Pressable
                key={plan.id}
                onPress={() => setSelected(plan.id)}
                style={{
                  padding: 16,
                  borderRadius: radii.lg,
                  borderWidth: 2,
                  borderColor: on ? t.brand : t.border,
                  backgroundColor: on ? t.brandSoft : t.surface,
                  shadowColor: on ? t.brand : "transparent",
                  shadowOpacity: on ? 0.18 : 0,
                  shadowRadius: 12,
                  elevation: on ? 3 : 0,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Text style={{ fontSize: 18, fontWeight: "700", color: t.ink, fontFamily: fonts.display }}>
                    {tr(plan.name)}
                  </Text>
                  {plan.highlighted && (
                    <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: t.brand }}>
                      <Text style={{ color: "white", fontSize: 10, fontWeight: "700", fontFamily: fonts.bodyBold }}>
                        <T fr="Populaire" en="Popular" />
                      </Text>
                    </View>
                  )}
                  <Text style={{ marginLeft: "auto", fontSize: 16, fontWeight: "700", color: t.brand600, fontFamily: fonts.display }}>
                    {plan.price}
                  </Text>
                </View>
                <View style={{ marginTop: 10, gap: 6 }}>
                  {plan.features.map((f, i) => (
                    <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Icon name="check" size={14} color={t.accent} />
                      <Text style={{ fontSize: 13, color: t.ink2, fontFamily: fonts.body }}>{tr(f)}</Text>
                    </View>
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Section moyens de paiement */}
        <Text style={{ marginTop: 28, fontSize: 11, color: t.ink3, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase", fontFamily: fonts.body }}>
          <T fr="Moyen de paiement" en="Payment method" />
        </Text>

        {/* Mobile Money — pertinent pour l'Afrique francophone */}
        <Pressable
          onPress={() => setMmOpen(true)}
          style={{
            marginTop: 10,
            padding: 16,
            borderRadius: radii.lg,
            borderWidth: 1,
            borderColor: t.border,
            backgroundColor: t.surface,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#FF660022", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 22 }}>📱</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold }}>
              <T fr="Mobile Money" en="Mobile Money" />
            </Text>
            <Text style={{ fontSize: 12, color: t.ink3, marginTop: 2, fontFamily: fonts.body }}>
              Orange · MTN · Airtel · Wave · M-Pesa
            </Text>
          </View>
          <Icon name="chevR" size={18} color={t.ink4} />
        </Pressable>

        {/* Stripe (carte) */}
        <Pressable
          onPress={subscribe}
          disabled={busy}
          style={{
            marginTop: 10,
            padding: 16,
            borderRadius: radii.lg,
            borderWidth: 1,
            borderColor: t.border,
            backgroundColor: t.surface,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            opacity: busy ? 0.6 : 1,
          }}
        >
          <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#6772E522", alignItems: "center", justifyContent: "center" }}>
            <Icon name="creditcard" size={20} color="#6772E5" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold }}>
              <T fr="Carte bancaire" en="Credit / Debit Card" />
            </Text>
            <Text style={{ fontSize: 12, color: t.ink3, marginTop: 2, fontFamily: fonts.body }}>
              Visa · Mastercard · Apple Pay · Google Pay
            </Text>
          </View>
          {busy ? <ActivityIndicator color={t.brand} /> : <Icon name="chevR" size={18} color={t.ink4} />}
        </Pressable>

        <Text style={{ marginTop: 18, textAlign: "center", fontSize: 11, color: t.ink3, fontFamily: fonts.body, lineHeight: 16 }}>
          <T
            fr="Essai 14 jours · sans engagement · annulable depuis le profil"
            en="14-day trial · no commitment · cancel anytime from profile"
          />
        </Text>
      </ScrollView>

      <MobileMoneySheet
        visible={mmOpen}
        onClose={(paid) => {
          setMmOpen(false);
          if (paid) router.replace("/(tabs)/profile");
        }}
        plan={currentPlan.id}
        amountCents={currentPlan.priceCents}
        currency="EUR"
      />
    </SafeAreaView>
  );
}
