// Bottom sheet pour le paiement Mobile Money (Orange, MTN, Airtel, Wave, M-Pesa).
// Mode manuel : affiche le numéro destinataire + collecte preuve, soumet à l'admin.

import { View, Text, Pressable, TextInput, ScrollView, Alert, Clipboard, KeyboardAvoidingView, Platform } from "react-native";
import { useState } from "react";

import { Icon } from "@/components/Icon";
import { Button } from "@/components/Button";
import { useTheme, fonts, radii } from "@/lib/theme";
import { T, useT } from "@/lib/i18n";
import {
  MM_PROVIDERS,
  RECIPIENT_NUMBER,
  RECIPIENT_NAME,
  createMobileMoneyPayment,
  type MMProvider,
} from "@/lib/mobileMoney";
import type { PlanId } from "@/lib/plans";

export function MobileMoneySheet({
  visible,
  onClose,
  plan,
  amountCents,
  currency,
}: {
  visible: boolean;
  onClose: (paid: boolean) => void;
  plan: PlanId;
  amountCents: number;
  currency: string;
}) {
  const t = useTheme();
  const tr = useT();
  const [step, setStep] = useState<"choose" | "instructions" | "confirm">("choose");
  const [provider, setProvider] = useState<MMProvider | null>(null);
  const [senderPhone, setSenderPhone] = useState("");
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);

  if (!visible) return null;

  const amountStr = `${(amountCents / 100).toFixed(2)} ${currency}`;
  const providerInfo = provider ? MM_PROVIDERS.find((p) => p.id === provider) : null;

  const close = (paid: boolean) => {
    setStep("choose");
    setProvider(null);
    setSenderPhone("");
    setReference("");
    onClose(paid);
  };

  const submit = async () => {
    if (!provider || !senderPhone || !reference) return;
    setBusy(true);
    const res = await createMobileMoneyPayment({
      plan,
      amountCents,
      currency,
      provider,
      senderPhone: senderPhone.trim(),
      reference: reference.trim(),
    });
    setBusy(false);
    if (res.ok) {
      Alert.alert(
        tr({ fr: "Merci !", en: "Thanks!" }),
        tr({
          fr: "Ta demande est en cours de vérification. Tu recevras une notification dès qu'elle est validée (sous 24h).",
          en: "Your request is being verified. You'll get a notification within 24h.",
        })
      );
      close(true);
    } else {
      Alert.alert("Erreur", res.error);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    Alert.alert(tr({ fr: "Copié", en: "Copied" }), `${label} : ${text}`);
  };

  return (
    <View
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "rgba(20,16,10,0.6)",
        justifyContent: "flex-end",
        zIndex: 100,
      }}
    >
      <Pressable style={{ flex: 1 }} onPress={() => close(false)} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View
          style={{
            backgroundColor: t.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: "85%",
          }}
        >
          {/* drag handle */}
          <View style={{ alignItems: "center", paddingTop: 10 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: t.border }} />
          </View>

          <View style={{ paddingHorizontal: 24, paddingVertical: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ fontFamily: fonts.display, fontSize: 18, fontWeight: "700", color: t.ink }}>
              {step === "choose"
                ? tr({ fr: "Mobile Money", en: "Mobile Money" })
                : step === "instructions"
                ? tr({ fr: "Faire le paiement", en: "Make the payment" })
                : tr({ fr: "Confirmer le paiement", en: "Confirm payment" })}
            </Text>
            <Pressable onPress={() => close(false)} style={{ padding: 6 }}>
              <Icon name="close" size={20} color={t.ink3} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}>
            {step === "choose" && (
              <>
                <Text style={{ fontSize: 13, color: t.ink3, marginBottom: 16, lineHeight: 19, fontFamily: fonts.body }}>
                  <T
                    fr="Choisis ton opérateur. Tu paieras directement vers le numéro E-KELASI."
                    en="Pick your operator. You'll pay directly to the E-KELASI number."
                  />
                </Text>
                <View style={{ gap: 8 }}>
                  {MM_PROVIDERS.map((p) => (
                    <Pressable
                      key={p.id}
                      onPress={() => {
                        setProvider(p.id);
                        setStep("instructions");
                      }}
                      style={{
                        padding: 14,
                        borderRadius: radii.md,
                        borderWidth: 1,
                        borderColor: t.border,
                        backgroundColor: t.surface,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          backgroundColor: p.color + "22",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text style={{ fontSize: 18 }}>{p.emoji}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold }}>
                          {p.name}
                        </Text>
                        <Text style={{ fontSize: 11, color: t.ink3, marginTop: 2, fontFamily: fonts.body }}>
                          {p.countries.join(" · ")}
                        </Text>
                      </View>
                      <Icon name="chevR" size={18} color={t.ink4} />
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            {step === "instructions" && providerInfo && (
              <>
                <View
                  style={{
                    padding: 16,
                    borderRadius: radii.md,
                    backgroundColor: providerInfo.color + "11",
                    borderWidth: 1,
                    borderColor: providerInfo.color + "44",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 16,
                  }}
                >
                  <Text style={{ fontSize: 22 }}>{providerInfo.emoji}</Text>
                  <View>
                    <Text style={{ fontSize: 13.5, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold }}>
                      {providerInfo.name}
                    </Text>
                    <Text style={{ fontSize: 11, color: t.ink3, fontFamily: fonts.body }}>
                      {providerInfo.countries.join(" · ")}
                    </Text>
                  </View>
                </View>

                <InstructionStep
                  num="1"
                  label={tr({ fr: "Ouvre ton app Mobile Money", en: "Open your Mobile Money app" })}
                  hint={tr({ fr: `ou compose le code USSD de ${providerInfo.name}`, en: `or dial the ${providerInfo.name} USSD code` })}
                />

                <CopyableField
                  label={tr({ fr: "Montant à envoyer", en: "Amount to send" })}
                  value={amountStr}
                  onCopy={() => copyToClipboard(amountStr, tr({ fr: "Montant", en: "Amount" }))}
                />
                <CopyableField
                  label={tr({ fr: "Numéro destinataire", en: "Recipient number" })}
                  value={RECIPIENT_NUMBER}
                  onCopy={() => copyToClipboard(RECIPIENT_NUMBER, tr({ fr: "Numéro", en: "Number" }))}
                  big
                />
                <Text style={{ fontSize: 12, color: t.ink3, marginTop: 6, fontFamily: fonts.body }}>
                  <T fr="Bénéficiaire" en="Recipient" /> : <Text style={{ fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold }}>{RECIPIENT_NAME}</Text>
                </Text>

                <View style={{ marginTop: 20, padding: 12, borderRadius: 10, backgroundColor: t.surface2 }}>
                  <Text style={{ fontSize: 12, color: t.ink2, lineHeight: 18, fontFamily: fonts.body }}>
                    <T
                      fr="⚠️ Note bien la référence de la transaction (TXN ID) qui s'affiche après l'envoi. Tu en auras besoin à l'étape suivante."
                      en="⚠️ Save the transaction reference (TXN ID) shown after sending. You'll need it next."
                    />
                  </Text>
                </View>

                <Button
                  onPress={() => setStep("confirm")}
                  style={{ marginTop: 20, paddingVertical: 14, borderRadius: 12 }}
                >
                  <Text style={{ color: t.onBrand, fontSize: 14.5, fontWeight: "700", fontFamily: fonts.bodyBold }}>
                    <T fr="J'ai fait le paiement →" en="I've paid →" />
                  </Text>
                </Button>
              </>
            )}

            {step === "confirm" && (
              <>
                <Text style={{ fontSize: 13, color: t.ink3, marginBottom: 16, lineHeight: 19, fontFamily: fonts.body }}>
                  <T
                    fr="Saisis les infos de ton paiement pour qu'on puisse le vérifier. Tu seras notifié dès validation (sous 24h)."
                    en="Enter your payment info so we can verify it. You'll be notified once validated (within 24h)."
                  />
                </Text>

                <Field
                  label={tr({ fr: "Numéro qui a envoyé", en: "Sender phone number" })}
                  value={senderPhone}
                  onChangeText={setSenderPhone}
                  placeholder="+243 8XX XXX XXX"
                  keyboardType="phone-pad"
                  icon="user"
                />
                <Field
                  label={tr({ fr: "Référence transaction (TXN ID)", en: "Transaction reference (TXN ID)" })}
                  value={reference}
                  onChangeText={setReference}
                  placeholder="ex: CI250524.1432.B12345"
                  autoCapitalize="characters"
                  icon="check"
                />

                <Button
                  onPress={submit}
                  disabled={busy || !senderPhone || !reference}
                  style={{ marginTop: 18, paddingVertical: 14, borderRadius: 12, opacity: busy || !senderPhone || !reference ? 0.6 : 1 }}
                >
                  <Text style={{ color: t.onBrand, fontSize: 14.5, fontWeight: "700", fontFamily: fonts.bodyBold }}>
                    {busy ? tr({ fr: "Envoi…", en: "Sending…" }) : tr({ fr: "Soumettre", en: "Submit" })}
                  </Text>
                </Button>

                <Pressable onPress={() => setStep("instructions")} style={{ marginTop: 12, alignItems: "center" }}>
                  <Text style={{ fontSize: 12.5, color: t.ink3, fontFamily: fonts.body }}>
                    <T fr="← Revenir aux instructions" en="← Back to instructions" />
                  </Text>
                </Pressable>
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function InstructionStep({ num, label, hint }: { num: string; label: string; hint?: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: 12, marginBottom: 14 }}>
      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: t.brand, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "white", fontSize: 13, fontWeight: "700", fontFamily: fonts.bodyBold }}>{num}</Text>
      </View>
      <View style={{ flex: 1, paddingTop: 4 }}>
        <Text style={{ fontSize: 13.5, fontWeight: "600", color: t.ink, fontFamily: fonts.bodyBold }}>{label}</Text>
        {hint && <Text style={{ fontSize: 12, color: t.ink3, marginTop: 2, fontFamily: fonts.body }}>{hint}</Text>}
      </View>
    </View>
  );
}

function CopyableField({ label, value, onCopy, big }: { label: string; value: string; onCopy: () => void; big?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ marginTop: 12 }}>
      <Text style={{ fontSize: 11, color: t.ink3, fontWeight: "600", letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 4, fontFamily: fonts.body }}>
        {label}
      </Text>
      <Pressable
        onPress={onCopy}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          padding: 14,
          borderRadius: radii.md,
          backgroundColor: t.surface2,
          borderWidth: 1,
          borderColor: t.borderStrong,
        }}
      >
        <Text style={{ flex: 1, fontSize: big ? 18 : 14, fontWeight: "700", color: t.ink, fontFamily: fonts.display, letterSpacing: -0.3 }}>
          {value}
        </Text>
        <Icon name="file" size={16} color={t.ink3} />
        <Text style={{ fontSize: 11, color: t.brand600, fontWeight: "600", fontFamily: fonts.bodyBold }}>
          <T fr="Copier" en="Copy" />
        </Text>
      </Pressable>
    </View>
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
    <View style={{ marginTop: 12 }}>
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
