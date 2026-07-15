import { View, Text, TextInput, ScrollView, Pressable, Modal, ActivityIndicator } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";

import { ScreenHeader } from "@/components/ScreenHeader";
import { Card } from "@/components/Card";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/Button";
import { useTheme, fonts } from "@/lib/theme";
import { useT } from "@/lib/i18n";
import { supabase, isLiveMode } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { useChildren } from "@/lib/children";
import { CLASS_GROUPS, OPTIONS, classRequiresOption } from "@/lib/schoolLevels";

const WEB_API = process.env.EXPO_PUBLIC_WEB_API_URL ?? "";

export default function Reenroll() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const { session } = useAuth();
  const { children, selectedChild } = useChildren();

  const now = new Date();
  const baseYear = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  const [schoolYear, setSchoolYear] = useState(`${baseYear + 1}-${baseYear + 2}`);

  const [childId, setChildId] = useState<string>(selectedChild?.id ?? "");
  const child = children.find((c) => c.id === childId) ?? selectedChild ?? null;

  const [mode, setMode] = useState<"promotion" | "redoublant">("promotion");
  const [className, setClassName] = useState(child?.grade ?? "");
  const [option, setOption] = useState(child?.option ?? "");

  // Infos élève
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [sex, setSex] = useState<"M" | "F" | "">(child?.sex === "M" || child?.sex === "F" ? child.sex : "");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [studentAddress, setStudentAddress] = useState("");

  // Infos parent
  const [parentName, setParentName] = useState(session?.fullName ?? "");
  const [parentPhone, setParentPhone] = useState("");
  const [parentEmail, setParentEmail] = useState(session?.email ?? "");
  const [parentAddress, setParentAddress] = useState("");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const needsOption = classRequiresOption(className);
  const canSubmit = child && className && (!needsOption || option);

  const birthDate = (() => {
    const d = parseInt(day, 10), m = parseInt(month, 10), y = parseInt(year, 10);
    if (!d || !m || !y || year.length !== 4) return "";
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  })();

  const submit = async () => {
    setMsg(null);
    if (!canSubmit) { setMsg({ ok: false, text: tr({ fr: "Complétez la classe (et l'option).", en: "Complete class (and option)." }) }); return; }
    if (!isLiveMode || !supabase) { setMsg({ ok: true, text: "Envoyé (démo)." }); return; }
    setBusy(true);
    try {
      const { data: { session: s } } = await supabase.auth.getSession();
      const r = await fetch(`${WEB_API}/api/parent/reenroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${s?.access_token}` },
        body: JSON.stringify({
          studentId: child!.id, schoolYear, mode, requestedClass: className, option: needsOption ? option : null,
          studentData: { firstName, middleName, lastName, sex, birthDate, address: studentAddress },
          parentData: { fullName: parentName, phone: parentPhone, email: parentEmail, address: parentAddress },
        }),
      });
      const data = await r.json();
      setBusy(false);
      if (data?.ok) {
        setMsg({ ok: true, text: tr({ fr: "Demande envoyée ! L'école va l'examiner.", en: "Sent! The school will review it." }) });
        setTimeout(() => router.back(), 1500);
      } else {
        setMsg({ ok: false, text: tr({ fr: "Échec de l'envoi. Réessaie.", en: "Failed. Try again." }) });
      }
    } catch {
      setBusy(false);
      setMsg({ ok: false, text: tr({ fr: "Erreur réseau.", en: "Network error." }) });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={["top", "bottom"]}>
      <ScreenHeader title={tr({ fr: "Réinscription à une nouvelle année scolaire", en: "New school-year re-enrollment" })} />
      {!child ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <Text style={{ fontSize: 14, color: t.ink3, textAlign: "center", fontFamily: fonts.body }}>
            {tr({ fr: "Aucun enfant enregistré.", en: "No child registered." })}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }} keyboardShouldPersistTaps="handled">
          {children.length > 1 && (
            <View>
              <Label>{tr({ fr: "Enfant", en: "Child" })}</Label>
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                {children.map((c) => {
                  const on = c.id === childId;
                  return (
                    <Pressable key={c.id} onPress={() => { setChildId(c.id); setClassName(c.grade); setOption(c.option ?? ""); }}
                      style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, backgroundColor: on ? t.brand : t.surface, borderWidth: 1, borderColor: on ? t.brand : t.borderStrong }}>
                      <Text style={{ fontSize: 13, fontWeight: "700", color: on ? t.onBrand : t.ink2, fontFamily: fonts.bodyBold }}>{c.name.split(" ").slice(-1)[0]}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          <View>
            <Label>{tr({ fr: "Année scolaire visée", en: "Target school year" })}</Label>
            <Input value={schoolYear} onChangeText={setSchoolYear} placeholder="2026-2027" />
          </View>

          <View>
            <Label>{tr({ fr: "Décision", en: "Decision" })}</Label>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {([["promotion", "Passage en classe supérieure"], ["redoublant", "Redoublant"]] as const).map(([m, lbl]) => {
                const on = mode === m;
                return (
                  <Pressable key={m} onPress={() => setMode(m)} style={{ flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center", backgroundColor: on ? t.brand : t.surface, borderWidth: 1, borderColor: on ? t.brand : t.borderStrong }}>
                    <Text style={{ fontSize: 12.5, fontWeight: "700", color: on ? t.onBrand : t.ink2, fontFamily: fonts.bodyBold, textAlign: "center" }}>{lbl}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View>
            <Label>{tr({ fr: "Classe pour la nouvelle année", en: "Class for the new year" })}</Label>
            <PickerField value={className} placeholder={tr({ fr: "Choisir la classe…", en: "Choose class…" })} groups={CLASS_GROUPS} onChange={setClassName} title={tr({ fr: "Choisir la classe", en: "Choose class" })} />
          </View>

          {needsOption && (
            <View>
              <Label>{tr({ fr: "Option / filière", en: "Option" })}</Label>
              <PickerField value={option} placeholder={tr({ fr: "Choisir l'option…", en: "Choose option…" })} groups={[{ group: "", items: OPTIONS }]} onChange={setOption} title={tr({ fr: "Choisir l'option", en: "Choose option" })} />
            </View>
          )}

          <Text style={{ fontSize: 13, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold, marginTop: 6 }}>
            {tr({ fr: "Mettre à jour les infos de l'enfant", en: "Update child info" })}
          </Text>
          <View><Label>{tr({ fr: "Nom", en: "Last name" })}</Label><Input value={lastName} onChangeText={setLastName} placeholder={child.name.split(" ")[0] ?? ""} autoCapitalize="characters" /></View>
          <View><Label>{tr({ fr: "Post-nom", en: "Middle name" })}</Label><Input value={middleName} onChangeText={setMiddleName} autoCapitalize="words" /></View>
          <View><Label>{tr({ fr: "Prénom", en: "First name" })}</Label><Input value={firstName} onChangeText={setFirstName} autoCapitalize="words" /></View>
          <View>
            <Label>{tr({ fr: "Sexe", en: "Sex" })}</Label>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {(["M", "F"] as const).map((s) => {
                const on = sex === s;
                return (
                  <Pressable key={s} onPress={() => setSex(s)} style={{ flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center", backgroundColor: on ? t.brand : t.surface, borderWidth: 1, borderColor: on ? t.brand : t.borderStrong }}>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: on ? t.onBrand : t.ink2, fontFamily: fonts.bodyBold }}>{s === "M" ? "Masculin" : "Féminin"}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <View>
            <Label>{tr({ fr: "Date de naissance", en: "Birth date" })}</Label>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Input style={{ flex: 1 }} value={day} onChangeText={(v: string) => setDay(v.replace(/\D/g, "").slice(0, 2))} placeholder={tr({ fr: "Jour", en: "Day" })} keyboardType="number-pad" textAlign="center" />
              <Input style={{ flex: 1 }} value={month} onChangeText={(v: string) => setMonth(v.replace(/\D/g, "").slice(0, 2))} placeholder={tr({ fr: "Mois", en: "Month" })} keyboardType="number-pad" textAlign="center" />
              <Input style={{ flex: 1.3 }} value={year} onChangeText={(v: string) => setYear(v.replace(/\D/g, "").slice(0, 4))} placeholder={tr({ fr: "Année", en: "Year" })} keyboardType="number-pad" textAlign="center" />
            </View>
          </View>
          <View><Label>{tr({ fr: "Adresse", en: "Address" })}</Label><Input value={studentAddress} onChangeText={setStudentAddress} /></View>

          <Text style={{ fontSize: 13, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold, marginTop: 6 }}>
            {tr({ fr: "Mettre à jour vos infos (parent/tuteur)", en: "Update your info" })}
          </Text>
          <View><Label>{tr({ fr: "Nom complet", en: "Full name" })}</Label><Input value={parentName} onChangeText={setParentName} autoCapitalize="words" /></View>
          <View><Label>{tr({ fr: "Téléphone", en: "Phone" })}</Label><Input value={parentPhone} onChangeText={setParentPhone} keyboardType="phone-pad" /></View>
          <View><Label>{tr({ fr: "Email", en: "Email" })}</Label><Input value={parentEmail} onChangeText={setParentEmail} keyboardType="email-address" autoCapitalize="none" /></View>
          <View><Label>{tr({ fr: "Adresse", en: "Address" })}</Label><Input value={parentAddress} onChangeText={setParentAddress} /></View>

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
            {tr({ fr: "L'école examinera puis validera (avec signature) ou rejettera votre demande.", en: "The school will review then validate (signed) or reject your request." })}
          </Text>
        </ScrollView>
      )}
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
    <TextInput {...props} placeholderTextColor={t.ink4}
      style={[{ paddingHorizontal: 12, paddingVertical: 12, borderRadius: 12, backgroundColor: t.surface, borderWidth: 1, borderColor: t.borderStrong, fontSize: 14, color: t.ink, fontFamily: fonts.body }, props.style]} />
  );
}

function PickerField({ value, placeholder, groups, onChange, title }: {
  value: string; placeholder: string; groups: { group: string; items: string[] }[]; onChange: (v: string) => void; title: string;
}) {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  // Voir notifications.tsx : une Modal n'hérite pas des insets du SafeAreaView.
  const insets = useSafeAreaInsets();
  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={{ paddingHorizontal: 12, paddingVertical: 13, borderRadius: 12, backgroundColor: t.surface, borderWidth: 1, borderColor: t.borderStrong, flexDirection: "row", alignItems: "center" }}>
        <Text style={{ flex: 1, fontSize: 14, color: value ? t.ink : t.ink4, fontFamily: fonts.body }}>{value || placeholder}</Text>
        <Icon name="chevR" size={18} color={t.ink3} />
      </Pressable>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable onPress={() => setOpen(false)} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}>
          <Pressable onPress={() => {}} style={{ backgroundColor: t.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "75%", paddingBottom: Math.max(24, insets.bottom + 16) }}>
            <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: t.divider, flexDirection: "row", alignItems: "center" }}>
              <Text style={{ flex: 1, fontSize: 16, fontWeight: "700", color: t.ink, fontFamily: fonts.display }}>{title}</Text>
              <Pressable onPress={() => setOpen(false)}><Icon name="close" size={20} color={t.ink3} /></Pressable>
            </View>
            <ScrollView contentContainerStyle={{ padding: 8 }}>
              {groups.map((g, gi) => (
                <View key={gi}>
                  {g.group ? <Text style={{ fontSize: 11, fontWeight: "700", color: t.ink3, textTransform: "uppercase", letterSpacing: 0.6, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 4, fontFamily: fonts.body }}>{g.group}</Text> : null}
                  {g.items.map((item) => {
                    const on = item === value;
                    return (
                      <Pressable key={item} onPress={() => { onChange(item); setOpen(false); }} style={{ paddingHorizontal: 12, paddingVertical: 13, borderRadius: 10, flexDirection: "row", alignItems: "center", backgroundColor: on ? t.brandSoft : "transparent" }}>
                        <Text style={{ flex: 1, fontSize: 14.5, color: on ? t.brand600 : t.ink, fontWeight: on ? "700" : "500", fontFamily: on ? fonts.bodyBold : fonts.body }}>{item}</Text>
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
