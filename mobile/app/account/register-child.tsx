import { View, Text, TextInput, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";

import { ScreenHeader } from "@/components/ScreenHeader";
import { Card } from "@/components/Card";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/Button";
import { useTheme, fonts } from "@/lib/theme";
import { useT } from "@/lib/i18n";
import { supabase, isLiveMode } from "@/lib/supabase";

const WEB_API = process.env.EXPO_PUBLIC_WEB_API_URL ?? "";

type School = { id: string; name: string; city: string; commune: string | null; quartier: string | null };

export default function RegisterChild() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<School[]>([]);
  const [searching, setSearching] = useState(false);
  const [school, setSchool] = useState<School | null>(null);

  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [sex, setSex] = useState<"M" | "F" | null>(null);
  const [birthDate, setBirthDate] = useState("");
  const [className, setClassName] = useState("");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const timer = useRef<any>(null);

  // Recherche d'école (anti-rebond).
  useEffect(() => {
    if (school || query.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const r = await fetch(`${WEB_API}/api/schools/search?q=${encodeURIComponent(query.trim())}`);
        const data = await r.json();
        setResults(data?.schools ?? []);
      } catch { setResults([]); }
      setSearching(false);
    }, 400);
    return () => clearTimeout(timer.current);
  }, [query, school]);

  const canSubmit = school && firstName.trim() && lastName.trim();

  const submit = async () => {
    setMsg(null);
    if (!canSubmit) return;
    if (!isLiveMode || !supabase) { setMsg({ ok: true, text: tr({ fr: "Envoyé (démo).", en: "Sent (demo)." }) }); return; }
    setBusy(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const r = await fetch(`${WEB_API}/api/parent/register-child`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          schoolId: school!.id, firstName: firstName.trim(), middleName: middleName.trim(),
          lastName: lastName.trim(), sex, birthDate: birthDate.trim(), className: className.trim(),
        }),
      });
      const data = await r.json();
      setBusy(false);
      if (data?.ok) {
        setMsg({ ok: true, text: tr({ fr: "Demande envoyée ! En attente de validation par l'école.", en: "Request sent! Awaiting school validation." }) });
        setTimeout(() => router.back(), 1400);
      } else {
        setMsg({ ok: false, text: tr({ fr: "Échec de l'envoi. Réessaie.", en: "Failed to send. Try again." }) });
      }
    } catch {
      setBusy(false);
      setMsg({ ok: false, text: tr({ fr: "Erreur réseau.", en: "Network error." }) });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={["top", "bottom"]}>
      <ScreenHeader title={tr({ fr: "Enregistrer mon enfant", en: "Register my child" })} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }} keyboardShouldPersistTaps="handled">
        {/* École */}
        <View>
          <Label>{tr({ fr: "École", en: "School" })}</Label>
          {school ? (
            <Card style={{ padding: 12, flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold }}>{school.name}</Text>
                <Text style={{ fontSize: 12, color: t.ink3, fontFamily: fonts.body }}>
                  {[school.commune, school.quartier, school.city].filter(Boolean).join(" · ")}
                </Text>
              </View>
              <Pressable onPress={() => { setSchool(null); setQuery(""); }}>
                <Icon name="close" size={18} color={t.ink3} />
              </Pressable>
            </Card>
          ) : (
            <>
              <Input value={query} onChangeText={setQuery} placeholder={tr({ fr: "Tapez le nom de l'école…", en: "Type the school name…" })} />
              {searching && <ActivityIndicator color={t.brand} style={{ marginTop: 8 }} />}
              {results.map((s) => (
                <Pressable key={s.id} onPress={() => { setSchool(s); setResults([]); }} style={{ marginTop: 8 }}>
                  <Card style={{ padding: 12 }}>
                    <Text style={{ fontSize: 13.5, fontWeight: "600", color: t.ink, fontFamily: fonts.bodyBold }}>{s.name}</Text>
                    <Text style={{ fontSize: 11.5, color: t.ink3, fontFamily: fonts.body }}>
                      {[s.commune, s.quartier, s.city].filter(Boolean).join(" · ")}
                    </Text>
                  </Card>
                </Pressable>
              ))}
              {query.trim().length >= 2 && !searching && results.length === 0 && (
                <Text style={{ fontSize: 12, color: t.ink3, marginTop: 8, fontFamily: fonts.body }}>
                  {tr({ fr: "Aucune école trouvée.", en: "No school found." })}
                </Text>
              )}
            </>
          )}
        </View>

        {/* Identité de l'enfant (système congolais : Nom, Post-nom, Prénom) */}
        <View>
          <Label>{tr({ fr: "Nom", en: "Last name" })}</Label>
          <Input value={lastName} onChangeText={setLastName} placeholder="Kabongo" autoCapitalize="characters" />
        </View>
        <View>
          <Label>{tr({ fr: "Post-nom", en: "Middle name" })}</Label>
          <Input value={middleName} onChangeText={setMiddleName} placeholder="Mwamba" autoCapitalize="words" />
        </View>
        <View>
          <Label>{tr({ fr: "Prénom", en: "First name" })}</Label>
          <Input value={firstName} onChangeText={setFirstName} placeholder="Amina" autoCapitalize="words" />
        </View>

        {/* Sexe */}
        <View>
          <Label>{tr({ fr: "Sexe", en: "Sex" })}</Label>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {(["M", "F"] as const).map((s) => {
              const on = sex === s;
              return (
                <Pressable key={s} onPress={() => setSex(s)} style={{ flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center", backgroundColor: on ? t.brand : t.surface, borderWidth: 1, borderColor: on ? t.brand : t.borderStrong }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: on ? t.onBrand : t.ink2, fontFamily: fonts.bodyBold }}>
                    {s === "M" ? tr({ fr: "Garçon", en: "Boy" }) : tr({ fr: "Fille", en: "Girl" })}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View>
          <Label>{tr({ fr: "Date de naissance (AAAA-MM-JJ)", en: "Birth date (YYYY-MM-DD)" })}</Label>
          <Input value={birthDate} onChangeText={setBirthDate} placeholder="2014-09-21" keyboardType="numbers-and-punctuation" />
        </View>
        <View>
          <Label>{tr({ fr: "Classe / année", en: "Class / grade" })}</Label>
          <Input value={className} onChangeText={setClassName} placeholder="6ème A" />
        </View>

        {msg && (
          <View style={{ padding: 12, borderRadius: 10, backgroundColor: msg.ok ? "rgba(45,134,89,0.10)" : "rgba(192,58,43,0.10)" }}>
            <Text style={{ color: msg.ok ? t.accent : t.danger, fontSize: 12.5, fontWeight: "600", fontFamily: fonts.bodyBold }}>{msg.text}</Text>
          </View>
        )}

        <Button onPress={submit} disabled={busy || !canSubmit} style={{ marginTop: 4, paddingVertical: 15, borderRadius: 14, opacity: busy || !canSubmit ? 0.6 : 1 }}>
          <Text style={{ color: t.onBrand, fontSize: 15, fontWeight: "700", fontFamily: fonts.bodyBold }}>
            {busy ? tr({ fr: "Envoi…", en: "Sending…" }) : tr({ fr: "Envoyer la demande", en: "Send request" })}
          </Text>
        </Button>
        <Text style={{ fontSize: 11.5, color: t.ink3, fontFamily: fonts.body, lineHeight: 17, textAlign: "center" }}>
          {tr({ fr: "L'école vérifiera l'inscription de votre enfant avant de valider l'accès.", en: "The school will verify your child's enrollment before granting access." })}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return <Text style={{ fontSize: 12, fontWeight: "600", color: t.ink2, fontFamily: fonts.bodyBold, marginBottom: 6 }}>{children}</Text>;
}

function Input(props: React.ComponentProps<typeof TextInput>) {
  const t = useTheme();
  return (
    <TextInput
      {...props}
      placeholderTextColor={t.ink4}
      style={{ paddingHorizontal: 12, paddingVertical: 12, borderRadius: 12, backgroundColor: t.surface, borderWidth: 1, borderColor: t.borderStrong, fontSize: 14, color: t.ink, fontFamily: fonts.body }}
    />
  );
}
