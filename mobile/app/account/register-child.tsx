import { View, Text, TextInput, ScrollView, Pressable, ActivityIndicator, Modal } from "react-native";
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
import { CLASS_GROUPS, OPTIONS, classRequiresOption } from "@/lib/schoolLevels";

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
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [className, setClassName] = useState("");
  const [option, setOption] = useState("");
  const [address, setAddress] = useState("");

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

  const needsOption = classRequiresOption(className);
  // Quand la classe change et n'a plus besoin d'option, on efface l'option.
  useEffect(() => {
    if (!needsOption && option) setOption("");
  }, [needsOption]);

  // Date de naissance ISO (AAAA-MM-JJ) si les 3 champs sont valides, sinon vide.
  function buildBirthDate(): string {
    const d = parseInt(day, 10), m = parseInt(month, 10), y = parseInt(year, 10);
    if (!d || !m || !y || year.length !== 4 || d < 1 || d > 31 || m < 1 || m > 12) return "";
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  const dateOk = !day && !month && !year ? true : buildBirthDate() !== "";

  const canSubmit =
    school && firstName.trim() && lastName.trim() && className && dateOk && (!needsOption || option);

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
          lastName: lastName.trim(), sex, birthDate: buildBirthDate(), className,
          option: needsOption ? option : null, address: address.trim(),
        }),
      });
      const data = await r.json();
      setBusy(false);
      if (data?.ok) {
        setMsg({ ok: true, text: tr({ fr: "Demande envoyée ! En attente de validation par l'école.", en: "Request sent! Awaiting school validation." }) });
        setTimeout(() => router.back(), 1400);
      } else {
        const detail = typeof data?.error === "string" ? ` (${data.error})` : "";
        setMsg({ ok: false, text: tr({ fr: `Échec de l'envoi. Réessaie.${detail}`, en: `Failed to send. Try again.${detail}` }) });
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
                    {s === "M" ? tr({ fr: "Masculin", en: "Male" }) : tr({ fr: "Féminin", en: "Female" })}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Date de naissance — jour / mois / année */}
        <View>
          <Label>{tr({ fr: "Date de naissance", en: "Birth date" })}</Label>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Input value={day} onChangeText={(v: string) => setDay(v.replace(/\D/g, "").slice(0, 2))} placeholder={tr({ fr: "Jour", en: "Day" })} keyboardType="number-pad" textAlign="center" />
            </View>
            <View style={{ flex: 1 }}>
              <Input value={month} onChangeText={(v: string) => setMonth(v.replace(/\D/g, "").slice(0, 2))} placeholder={tr({ fr: "Mois", en: "Month" })} keyboardType="number-pad" textAlign="center" />
            </View>
            <View style={{ flex: 1.3 }}>
              <Input value={year} onChangeText={(v: string) => setYear(v.replace(/\D/g, "").slice(0, 4))} placeholder={tr({ fr: "Année", en: "Year" })} keyboardType="number-pad" textAlign="center" />
            </View>
          </View>
          {!dateOk && (
            <Text style={{ fontSize: 11.5, color: t.danger, marginTop: 6, fontFamily: fonts.body }}>
              {tr({ fr: "Date invalide (ex. 21 / 09 / 2014).", en: "Invalid date (e.g. 21 / 09 / 2014)." })}
            </Text>
          )}
        </View>

        {/* Classe / année */}
        <View>
          <Label>{tr({ fr: "Classe / année", en: "Class / grade" })}</Label>
          <PickerField
            value={className}
            placeholder={tr({ fr: "Choisir la classe…", en: "Choose class…" })}
            groups={CLASS_GROUPS}
            onChange={setClassName}
            title={tr({ fr: "Choisir la classe", en: "Choose class" })}
          />
        </View>

        {/* Option / filière (à partir de la 8e année) */}
        {needsOption && (
          <View>
            <Label>{tr({ fr: "Option / filière", en: "Option / track" })}</Label>
            <PickerField
              value={option}
              placeholder={tr({ fr: "Choisir l'option…", en: "Choose option…" })}
              groups={[{ group: "", items: OPTIONS }]}
              onChange={setOption}
              title={tr({ fr: "Choisir l'option", en: "Choose option" })}
            />
            <Text style={{ fontSize: 11.5, color: t.ink3, marginTop: 6, fontFamily: fonts.body, lineHeight: 16 }}>
              {tr({ fr: "L'option est requise à partir de la 8e année.", en: "An option is required from grade 8 onwards." })}
            </Text>
          </View>
        )}

        {/* Adresse de résidence */}
        <View>
          <Label>{tr({ fr: "Adresse de résidence", en: "Home address" })}</Label>
          <Input
            value={address}
            onChangeText={setAddress}
            placeholder={tr({ fr: "Commune, quartier, avenue, n°…", en: "Municipality, neighborhood, street, no.…" })}
            autoCapitalize="words"
          />
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

// Sélecteur (liste déroulante via modal) — groupes optionnels.
function PickerField({
  value,
  placeholder,
  groups,
  onChange,
  title,
}: {
  value: string;
  placeholder: string;
  groups: { group: string; items: string[] }[];
  onChange: (v: string) => void;
  title: string;
}) {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={{ paddingHorizontal: 12, paddingVertical: 13, borderRadius: 12, backgroundColor: t.surface, borderWidth: 1, borderColor: t.borderStrong, flexDirection: "row", alignItems: "center" }}
      >
        <Text style={{ flex: 1, fontSize: 14, color: value ? t.ink : t.ink4, fontFamily: fonts.body }}>
          {value || placeholder}
        </Text>
        <Icon name="chevR" size={18} color={t.ink3} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable onPress={() => setOpen(false)} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}>
          <Pressable onPress={() => {}} style={{ backgroundColor: t.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "75%", paddingBottom: 24 }}>
            <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: t.divider, flexDirection: "row", alignItems: "center" }}>
              <Text style={{ flex: 1, fontSize: 16, fontWeight: "700", color: t.ink, fontFamily: fonts.display }}>{title}</Text>
              <Pressable onPress={() => setOpen(false)}>
                <Icon name="close" size={20} color={t.ink3} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ padding: 8 }}>
              {groups.map((g, gi) => (
                <View key={gi}>
                  {g.group ? (
                    <Text style={{ fontSize: 11, fontWeight: "700", color: t.ink3, textTransform: "uppercase", letterSpacing: 0.6, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 4, fontFamily: fonts.body }}>
                      {g.group}
                    </Text>
                  ) : null}
                  {g.items.map((item) => {
                    const on = item === value;
                    return (
                      <Pressable
                        key={item}
                        onPress={() => { onChange(item); setOpen(false); }}
                        style={{ paddingHorizontal: 12, paddingVertical: 13, borderRadius: 10, flexDirection: "row", alignItems: "center", backgroundColor: on ? t.brandSoft : "transparent" }}
                      >
                        <Text style={{ flex: 1, fontSize: 14.5, color: on ? t.brand600 : t.ink, fontWeight: on ? "700" : "500", fontFamily: on ? fonts.bodyBold : fonts.body }}>
                          {item}
                        </Text>
                        {on && <Icon name="check" size={18} color={t.brand600} />}
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
