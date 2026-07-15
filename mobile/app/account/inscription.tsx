import { View, Text, TextInput, ScrollView, Pressable, Modal, ActivityIndicator, Image } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";

import { ScreenHeader } from "@/components/ScreenHeader";
import { Card } from "@/components/Card";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/Button";
import { useTheme, fonts } from "@/lib/theme";
import { useT } from "@/lib/i18n";
import { supabase, isLiveMode } from "@/lib/supabase";
import { uploadFile } from "@/lib/upload";
import { CLASS_GROUPS, OPTIONS, classRequiresOption } from "@/lib/schoolLevels";

const WEB_API = process.env.EXPO_PUBLIC_WEB_API_URL ?? "";
type School = { id: string; name: string; city: string; commune: string | null; quartier: string | null };

export default function Inscription() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();

  const now = new Date();
  const baseY = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<School[]>([]);
  const [searching, setSearching] = useState(false);
  const [school, setSchool] = useState<School | null>(null);
  const timer = useRef<any>(null);

  const [schoolYear, setSchoolYear] = useState(`${baseY + 1}-${baseY + 2}`);
  const [className, setClassName] = useState("");
  const [option, setOption] = useState("");

  const [sd, setSd] = useState<Record<string, string>>({
    lastName: "", middleName: "", firstName: "", sex: "", day: "", month: "", year: "",
    birthPlace: "", nationality: "Congolaise (RDC)", studentPhone: "", studentEmail: "",
    prevSchool: "", prevClass: "", prevOption: "", addressCommune: "", addressCity: "", addressProvince: "",
  });
  const S = (k: string, v: string) => setSd((p) => ({ ...p, [k]: v }));
  const [pd, setPd] = useState<Record<string, string>>({
    fatherName: "", motherName: "", guardianName: "", parentPhone: "", parentAddress: "",
    parentProfession: "", emergencyContact: "", emergencyPhone: "",
  });
  const P = (k: string, v: string) => setPd((p) => ({ ...p, [k]: v }));

  const [photoStudent, setPhotoStudent] = useState<string | null>(null);
  const [photoParent, setPhotoParent] = useState<string | null>(null);
  const [doc, setDoc] = useState<{ uri: string; name: string; mime: string } | null>(null);

  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (school || query.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const r = await fetch(`${WEB_API}/api/schools/search?q=${encodeURIComponent(query.trim())}`);
        setResults((await r.json())?.schools ?? []);
      } catch { setResults([]); }
      setSearching(false);
    }, 400);
    return () => clearTimeout(timer.current);
  }, [query, school]);

  const needsOption = classRequiresOption(className);
  const canSubmit = school && sd.lastName.trim() && sd.firstName.trim() && className && (!needsOption || option);

  const pickPhoto = async (which: "student" | "parent") => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { setMsg({ ok: false, text: "Accès galerie refusé." }); return; }
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8, allowsEditing: true, aspect: [1, 1] });
    if (r.canceled || !r.assets?.[0]) return;
    (which === "student" ? setPhotoStudent : setPhotoParent)(r.assets[0].uri);
  };

  const pickDoc = async () => {
    const r = await DocumentPicker.getDocumentAsync({ type: ["application/pdf", "image/*"], copyToCacheDirectory: true });
    if (r.canceled || !r.assets?.[0]) return;
    const a = r.assets[0];
    if (a.size && a.size > 20 * 1024 * 1024) { setMsg({ ok: false, text: "Fichier trop lourd (max 20 Mo)." }); return; }
    setDoc({ uri: a.uri, name: a.name, mime: a.mimeType ?? "application/pdf" });
  };

  const birthDate = (() => {
    const d = parseInt(sd.day, 10), m = parseInt(sd.month, 10), y = parseInt(sd.year, 10);
    if (!d || !m || !y || sd.year.length !== 4) return "";
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  })();

  const submit = async () => {
    setMsg(null);
    if (!canSubmit) { setMsg({ ok: false, text: "Complétez école, nom, prénom et classe." }); return; }
    if (!isLiveMode || !supabase) { setMsg({ ok: true, text: "Envoyé (démo)." }); return; }
    setBusy(true);
    try {
      const folder = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      let photoStudentUrl: string | undefined, photoParentUrl: string | undefined, documentsUrl: string | undefined;
      if (photoStudent) { setProgress("Photo élève…"); photoStudentUrl = (await uploadFile("inscription-docs", `${folder}/eleve.jpg`, photoStudent, "image/jpeg")) ?? undefined; }
      if (photoParent) { setProgress("Photo parent…"); photoParentUrl = (await uploadFile("inscription-docs", `${folder}/parent.jpg`, photoParent, "image/jpeg")) ?? undefined; }
      if (doc) { setProgress("Documents…"); const ext = doc.mime.includes("pdf") ? "pdf" : (doc.name.split(".").pop() || "jpg"); documentsUrl = (await uploadFile("inscription-docs", `${folder}/documents.${ext}`, doc.uri, doc.mime)) ?? undefined; }

      setProgress("Envoi du dossier…");
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch(`${WEB_API}/api/parent/inscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({
          schoolId: school!.id, schoolYear, requestedClass: className, option: needsOption ? option : null,
          studentData: { ...sd, birthDate, day: undefined, month: undefined, year: undefined },
          parentData: pd, photoStudentUrl, photoParentUrl, documentsUrl,
        }),
      });
      const data = await r.json();
      setBusy(false); setProgress("");
      if (data?.ok) {
        setMsg({ ok: true, text: tr({ fr: "Dossier envoyé ! L'école va l'examiner.", en: "Sent! The school will review it." }) });
        setTimeout(() => router.back(), 1600);
      } else {
        setMsg({ ok: false, text: tr({ fr: "Échec de l'envoi. Réessaie.", en: "Failed. Try again." }) });
      }
    } catch {
      setBusy(false); setProgress("");
      setMsg({ ok: false, text: tr({ fr: "Erreur réseau.", en: "Network error." }) });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={["top", "bottom"]}>
      <ScreenHeader title={tr({ fr: "Inscription à une nouvelle année scolaire", en: "New school-year admission" })} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }} keyboardShouldPersistTaps="handled">
        {/* École */}
        <Section title="École" />
        {school ? (
          <Card style={{ padding: 12, flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold }}>{school.name}</Text>
              <Text style={{ fontSize: 12, color: t.ink3, fontFamily: fonts.body }}>{[school.commune, school.city].filter(Boolean).join(" · ")}</Text>
            </View>
            <Pressable onPress={() => { setSchool(null); setQuery(""); }}><Icon name="close" size={18} color={t.ink3} /></Pressable>
          </Card>
        ) : (
          <>
            <Input value={query} onChangeText={setQuery} placeholder={tr({ fr: "Nom de l'école…", en: "School name…" })} />
            {searching && <ActivityIndicator color={t.brand} style={{ marginTop: 8 }} />}
            {results.map((s) => (
              <Pressable key={s.id} onPress={() => { setSchool(s); setResults([]); }} style={{ marginTop: 6 }}>
                <Card style={{ padding: 12 }}>
                  <Text style={{ fontSize: 13.5, fontWeight: "600", color: t.ink, fontFamily: fonts.bodyBold }}>{s.name}</Text>
                  <Text style={{ fontSize: 11.5, color: t.ink3, fontFamily: fonts.body }}>{[s.commune, s.city].filter(Boolean).join(" · ")}</Text>
                </Card>
              </Pressable>
            ))}
          </>
        )}

        <Field label={tr({ fr: "Année scolaire", en: "School year" })}><Input value={schoolYear} onChangeText={setSchoolYear} placeholder="2026-2027" /></Field>
        <Field label={tr({ fr: "Classe à inscrire", en: "Class" })}>
          <PickerField value={className} placeholder="Choisir la classe…" groups={CLASS_GROUPS} onChange={setClassName} title="Classe" />
        </Field>
        {needsOption && (
          <Field label={tr({ fr: "Option / section", en: "Option" })}>
            <PickerField value={option} placeholder="Choisir l'option…" groups={[{ group: "", items: OPTIONS }]} onChange={setOption} title="Option" />
          </Field>
        )}

        {/* Élève */}
        <Section title="Identité de l'élève" />
        <Field label="Nom"><Input value={sd.lastName} onChangeText={(v: string) => S("lastName", v)} autoCapitalize="characters" /></Field>
        <Field label="Post-nom"><Input value={sd.middleName} onChangeText={(v: string) => S("middleName", v)} autoCapitalize="words" /></Field>
        <Field label="Prénom"><Input value={sd.firstName} onChangeText={(v: string) => S("firstName", v)} autoCapitalize="words" /></Field>
        <Field label="Sexe">
          <View style={{ flexDirection: "row", gap: 10 }}>
            {(["M", "F"] as const).map((s) => {
              const on = sd.sex === s;
              return (
                <Pressable key={s} onPress={() => S("sex", s)} style={{ flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center", backgroundColor: on ? t.brand : t.surface, borderWidth: 1, borderColor: on ? t.brand : t.borderStrong }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: on ? t.onBrand : t.ink2, fontFamily: fonts.bodyBold }}>{s === "M" ? "Masculin" : "Féminin"}</Text>
                </Pressable>
              );
            })}
          </View>
        </Field>
        <Field label="Date de naissance">
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Input style={{ flex: 1 }} value={sd.day} onChangeText={(v: string) => S("day", v.replace(/\D/g, "").slice(0, 2))} placeholder="JJ" keyboardType="number-pad" textAlign="center" />
            <Input style={{ flex: 1 }} value={sd.month} onChangeText={(v: string) => S("month", v.replace(/\D/g, "").slice(0, 2))} placeholder="MM" keyboardType="number-pad" textAlign="center" />
            <Input style={{ flex: 1.3 }} value={sd.year} onChangeText={(v: string) => S("year", v.replace(/\D/g, "").slice(0, 4))} placeholder="AAAA" keyboardType="number-pad" textAlign="center" />
          </View>
        </Field>
        <Field label="Lieu de naissance"><Input value={sd.birthPlace} onChangeText={(v: string) => S("birthPlace", v)} autoCapitalize="words" /></Field>
        <Field label="Nationalité"><Input value={sd.nationality} onChangeText={(v: string) => S("nationality", v)} /></Field>
        <Field label="Téléphone élève (si applicable)"><Input value={sd.studentPhone} onChangeText={(v: string) => S("studentPhone", v)} keyboardType="phone-pad" /></Field>
        <Field label="Email élève (si applicable)"><Input value={sd.studentEmail} onChangeText={(v: string) => S("studentEmail", v)} keyboardType="email-address" autoCapitalize="none" /></Field>

        {/* École précédente */}
        <Section title="École précédente" />
        <Field label="Nom de l'école précédente"><Input value={sd.prevSchool} onChangeText={(v: string) => S("prevSchool", v)} /></Field>
        <Field label="Classe précédente"><Input value={sd.prevClass} onChangeText={(v: string) => S("prevClass", v)} /></Field>
        <Field label="Option/section précédente"><Input value={sd.prevOption} onChangeText={(v: string) => S("prevOption", v)} /></Field>

        {/* Adresse */}
        <Section title="Adresse de résidence" />
        <Field label="Commune"><Input value={sd.addressCommune} onChangeText={(v: string) => S("addressCommune", v)} /></Field>
        <Field label="Ville"><Input value={sd.addressCity} onChangeText={(v: string) => S("addressCity", v)} /></Field>
        <Field label="Province"><Input value={sd.addressProvince} onChangeText={(v: string) => S("addressProvince", v)} /></Field>

        {/* Parents */}
        <Section title="Parents / Tuteur" />
        <Field label="Nom du père"><Input value={pd.fatherName} onChangeText={(v: string) => P("fatherName", v)} autoCapitalize="words" /></Field>
        <Field label="Nom de la mère"><Input value={pd.motherName} onChangeText={(v: string) => P("motherName", v)} autoCapitalize="words" /></Field>
        <Field label="Tuteur légal"><Input value={pd.guardianName} onChangeText={(v: string) => P("guardianName", v)} autoCapitalize="words" /></Field>
        <Field label="Téléphone parent/tuteur"><Input value={pd.parentPhone} onChangeText={(v: string) => P("parentPhone", v)} keyboardType="phone-pad" /></Field>
        <Field label="Adresse parent/tuteur"><Input value={pd.parentAddress} onChangeText={(v: string) => P("parentAddress", v)} /></Field>
        <Field label="Profession parent/tuteur"><Input value={pd.parentProfession} onChangeText={(v: string) => P("parentProfession", v)} /></Field>
        <Field label="Personne à contacter (urgence)"><Input value={pd.emergencyContact} onChangeText={(v: string) => P("emergencyContact", v)} /></Field>
        <Field label="Téléphone d'urgence"><Input value={pd.emergencyPhone} onChangeText={(v: string) => P("emergencyPhone", v)} keyboardType="phone-pad" /></Field>

        {/* Pièces */}
        <Section title="Photos & documents" />
        <View style={{ flexDirection: "row", gap: 12 }}>
          <PhotoPick label="Photo élève" uri={photoStudent} onPick={() => pickPhoto("student")} />
          <PhotoPick label="Photo parent" uri={photoParent} onPick={() => pickPhoto("parent")} />
        </View>
        <Pressable onPress={pickDoc}>
          <Card style={{ padding: 14, flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Icon name="file" size={18} color={t.brand600} />
            <Text style={{ flex: 1, fontSize: 13, color: doc ? t.ink : t.ink3, fontFamily: fonts.body }} numberOfLines={1}>
              {doc ? doc.name : "Téléverser les documents (1 fichier, PDF/image, max 20 Mo)"}
            </Text>
            <Icon name="upload" size={16} color={t.ink3} />
          </Card>
        </Pressable>

        {msg && (
          <View style={{ padding: 12, borderRadius: 10, backgroundColor: msg.ok ? "rgba(45,134,89,0.10)" : "rgba(192,58,43,0.10)" }}>
            <Text style={{ color: msg.ok ? t.accent : t.danger, fontSize: 12.5, fontWeight: "600", fontFamily: fonts.bodyBold }}>{msg.text}</Text>
          </View>
        )}

        <Button onPress={submit} disabled={busy || !canSubmit} style={{ marginTop: 4, paddingVertical: 15, borderRadius: 14, opacity: busy || !canSubmit ? 0.6 : 1 }}>
          <Text style={{ color: t.onBrand, fontSize: 15, fontWeight: "700", fontFamily: fonts.bodyBold }}>
            {busy ? (progress || "Envoi…") : tr({ fr: "Envoyer le dossier", en: "Submit" })}
          </Text>
        </Button>
        <Text style={{ fontSize: 11.5, color: t.ink3, fontFamily: fonts.body, lineHeight: 17, textAlign: "center" }}>
          L'école validera après réception de la preuve de paiement, puis vous recevrez une confirmation PDF.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title }: { title: string }) {
  const t = useTheme();
  return <Text style={{ fontSize: 14, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold, marginTop: 8 }}>{title}</Text>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const t = useTheme();
  return (
    <View>
      <Text style={{ fontSize: 12, fontWeight: "600", color: t.ink2, fontFamily: fonts.bodyBold, marginBottom: 6 }}>{label}</Text>
      {children}
    </View>
  );
}
function Input(props: React.ComponentProps<typeof TextInput>) {
  const t = useTheme();
  return <TextInput {...props} placeholderTextColor={t.ink4} style={[{ paddingHorizontal: 12, paddingVertical: 12, borderRadius: 12, backgroundColor: t.surface, borderWidth: 1, borderColor: t.borderStrong, fontSize: 14, color: t.ink, fontFamily: fonts.body }, props.style]} />;
}
function PhotoPick({ label, uri, onPick }: { label: string; uri: string | null; onPick: () => void }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPick} style={{ flex: 1 }}>
      <View style={{ height: 96, borderRadius: 12, borderWidth: 1, borderColor: t.borderStrong, backgroundColor: t.surface, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {uri ? <Image source={{ uri }} style={{ width: "100%", height: "100%" }} /> : <><Icon name="camera" size={20} color={t.ink3} /><Text style={{ fontSize: 11, color: t.ink3, marginTop: 4, fontFamily: fonts.body }}>{label}</Text></>}
      </View>
    </Pressable>
  );
}
function PickerField({ value, placeholder, groups, onChange, title }: { value: string; placeholder: string; groups: { group: string; items: string[] }[]; onChange: (v: string) => void; title: string }) {
  const t = useTheme();
  // Voir notifications.tsx : une Modal n.h�rite pas des insets du SafeAreaView.
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
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
