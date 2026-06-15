// Home / Dashboard — greeting, child hero, recent grades, homework, messages preview.

import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import Svg, { Path } from "react-native-svg";

import { Logo } from "@/components/Logo";
import { Avatar } from "@/components/Avatar";
import { Icon } from "@/components/Icon";
import { Card, Chip } from "@/components/Card";
import { ChildSwitcher } from "@/components/ChildSwitcher";
import { useTheme, fonts, radii } from "@/lib/theme";
import { T, useT } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useChildren } from "@/lib/children";
import { type Grade, type Homework } from "@/lib/mock";
import { hasPendingChild, listAnnouncements, listGrades, listHomework, listThreads, type Announcement, type Child, type Thread } from "@/lib/db";
import { Linking } from "react-native";

export default function Home() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const { session } = useAuth();
  const parentName = session?.fullName ?? "Parent";
  const { children, selectedChild, loading: childrenLoading, refresh } = useChildren();

  const [pending, setPending] = useState(false);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dataReady, setDataReady] = useState(false);

  // Messagerie + annonces : une seule fois.
  useEffect(() => {
    listThreads().then(setThreads).catch(() => {});
    listAnnouncements().then(setAnnouncements).catch(() => {});
  }, []);

  // Aucun enfant actif → vérifie s'il y a une demande en attente.
  useEffect(() => {
    if (!childrenLoading && children.length === 0) {
      hasPendingChild().then(setPending).catch(() => setPending(false));
    }
  }, [childrenLoading, children.length]);

  // Notes + devoirs de l'enfant sélectionné (rechargés au changement d'enfant).
  useEffect(() => {
    if (!selectedChild) {
      setGrades([]);
      setHomework([]);
      setDataReady(true);
      return;
    }
    setDataReady(false);
    Promise.all([listGrades(5, selectedChild.id), listHomework(selectedChild.grade)]).then(([g, h]) => {
      setGrades(g);
      setHomework(h);
      setDataReady(true);
    });
  }, [selectedChild?.id]);

  const ready = !childrenLoading && (selectedChild ? dataReady : true);
  const child = selectedChild;

  if (!ready) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={t.brand} />
      </SafeAreaView>
    );
  }

  // Aucun enfant rattaché (l'école doit lier le parent à son enfant).
  if (!child) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={["top"]}>
        <HeaderGreeting parentName={parentName} onBell={() => router.push("/notifications")} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 }}>
          <Icon name={pending ? "clock" : "user"} size={40} color={pending ? t.warning : t.ink3} />
          <Text style={{ fontSize: 16, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold, textAlign: "center" }}>
            {pending
              ? tr({ fr: "En attente de validation", en: "Awaiting validation" })
              : tr({ fr: "Aucun enfant enregistré", en: "No child registered" })}
          </Text>
          <Text style={{ fontSize: 13, color: t.ink3, textAlign: "center", fontFamily: fonts.body, lineHeight: 20 }}>
            {pending
              ? tr({ fr: "Votre demande a été envoyée. L'école doit valider l'inscription de votre enfant.", en: "Your request was sent. The school must confirm your child's enrollment." })
              : tr({ fr: "Enregistrez votre enfant : l'école validera et vous verrez son suivi scolaire.", en: "Register your child: the school will confirm and you'll see their school journey." })}
          </Text>
          {!pending && (
            <Pressable
              onPress={() => router.push("/account/register-child")}
              style={{ marginTop: 6, backgroundColor: t.brand, paddingVertical: 14, paddingHorizontal: 22, borderRadius: 14 }}
            >
              <Text style={{ color: t.onBrand, fontSize: 15, fontWeight: "700", fontFamily: fonts.bodyBold }}>
                {tr({ fr: "Enregistrer mon enfant", en: "Register my child" })}
              </Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const upcoming = homework.find((h) => h.status === "todo") ?? homework[0];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        <HeaderGreeting parentName={parentName} onBell={() => router.push("/notifications")} />

        <ChildSwitcher style={{ paddingVertical: 6 }} />

        <View style={{ padding: 20, paddingTop: 12, gap: 14 }}>
          <ChildHero child={child} onAvatarChange={() => refresh()} />

          <Pressable
            onPress={() => child.schoolPhone && Linking.openURL(`tel:${child.schoolPhone}`)}
            disabled={!child.schoolPhone}
          >
            <Card style={{ padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: t.brandSoft, alignItems: "center", justifyContent: "center" }}>
                <Icon name="school" size={18} color={t.brand600} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: t.ink3, fontWeight: "600", fontFamily: fonts.body }}>
                  <T fr="Contact École" en="School contact" />
                </Text>
                <Text style={{ fontSize: 13.5, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold }}>{child.school}</Text>
                <Text style={{ fontSize: 12, color: t.ink3, fontFamily: fonts.body, marginTop: 1 }}>
                  {child.schoolPhone || tr({ fr: "Numéro non renseigné", en: "No number provided" })}
                </Text>
              </View>
              {child.schoolPhone ? <Icon name="chevR" size={18} color={t.brand} /> : null}
            </Card>
          </Pressable>

          {announcements.length > 0 && (
            <>
              <SectionTitle
                title={{ fr: "Annonces de l'école", en: "School announcements" }}
                action={{ fr: "Tout voir", en: "See all", onPress: () => router.push("/announcements") }}
              />
              <Pressable onPress={() => router.push("/announcements")}>
                <Card style={{ padding: 14, flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: t.brandSoft, alignItems: "center", justifyContent: "center" }}>
                    <Icon name="bell" size={16} color={t.brand600} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={1} style={{ fontSize: 13.5, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold }}>
                      {announcements[0].title}
                    </Text>
                    <Text numberOfLines={2} style={{ fontSize: 12.5, color: t.ink3, marginTop: 2, fontFamily: fonts.body }}>
                      {announcements[0].body}
                    </Text>
                  </View>
                </Card>
              </Pressable>
            </>
          )}

          <SectionTitle
            title={{ fr: "Nouvelles notes", en: "New grades" }}
            action={{ fr: "Tout voir", en: "See all", onPress: () => router.push("/(tabs)/grades") }}
          />
          <View style={{ gap: 10 }}>
            {grades.slice(0, 2).map((g, i) => (
              <GradeRow key={i} g={g} />
            ))}
            {grades.length === 0 && (
              <Text style={{ textAlign: "center", color: t.ink3, fontSize: 12.5, padding: 12, fontFamily: fonts.body }}>
                <T fr="Pas encore de notes." en="No grades yet." />
              </Text>
            )}
          </View>

          <SectionTitle
            title={{ fr: "À faire pour demain", en: "Due tomorrow" }}
            action={{ fr: "Tout voir", en: "See all", onPress: () => router.push("/(tabs)/homework") }}
          />
          {upcoming ? (
            <HomeworkCard hw={upcoming} />
          ) : (
            <Text style={{ textAlign: "center", color: t.ink3, fontSize: 12.5, padding: 12, fontFamily: fonts.body }}>
              <T fr="Aucun devoir." en="No homework." />
            </Text>
          )}

          <SectionTitle
            title={{ fr: "Messagerie", en: "Inbox" }}
            action={{ fr: "Ouvrir", en: "Open", onPress: () => router.push("/(tabs)/messages") }}
          />
          {threads.length > 0 ? (
            <Card style={{ padding: 4 }}>
              {threads.slice(0, 2).map((th, i) => (
                <Pressable
                  key={th.id}
                  onPress={() => router.push(`/thread/${th.id}`)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    padding: 12,
                    borderBottomWidth: i < 1 && threads.length > 1 ? 1 : 0,
                    borderBottomColor: t.divider,
                  }}
                >
                  <Avatar name={th.from} size={40} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                      <Text style={{ fontSize: 13.5, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold }}>{th.from}</Text>
                      <Text style={{ fontSize: 11, color: t.ink3, marginLeft: 6, fontFamily: fonts.body }}> · {th.subject}</Text>
                      <Text style={{ marginLeft: "auto", fontSize: 11, color: t.ink3, fontFamily: fonts.body }}>{th.time}</Text>
                    </View>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 12.5,
                        color: th.unread ? t.ink : t.ink3,
                        fontWeight: th.unread ? "600" : "400",
                        marginTop: 2,
                        fontFamily: th.unread ? fonts.bodyBold : fonts.body,
                      }}
                    >
                      {th.preview}
                    </Text>
                  </View>
                  {th.unread && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.brand }} />}
                </Pressable>
              ))}
            </Card>
          ) : (
            <Text style={{ textAlign: "center", color: t.ink3, fontSize: 12.5, padding: 12, fontFamily: fonts.body }}>
              <T fr="Pas de message." en="No messages." />
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function HeaderGreeting({ parentName, onBell }: { parentName: string; onBell: () => void }) {
  const t = useTheme();
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, flexDirection: "row", alignItems: "center", gap: 12 }}>
      <Logo size={26} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, color: t.ink3, fontWeight: "500", fontFamily: fonts.body }}>
          <T fr="Bonjour" en="Hello" />,
        </Text>
        <Text style={{ fontSize: 16, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold }}>{parentName}</Text>
      </View>
      <Pressable
        onPress={onBell}
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: t.surface,
          borderWidth: 1,
          borderColor: t.border,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name="bell" size={20} color={t.ink2} />
        <View
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: t.brand,
            borderWidth: 2,
            borderColor: t.surface,
          }}
        />
      </Pressable>
    </View>
  );
}

function ChildHero({ child, onAvatarChange }: { child: Child; onAvatarChange?: (url: string) => void }) {
  const t = useTheme();
  const [uploading, setUploading] = useState(false);

  const onPickPhoto = async () => {
    if (uploading) return;
    setUploading(true);
    const { pickAndUploadChildPhoto } = await import("@/lib/studentPhoto");
    const res = await pickAndUploadChildPhoto(child.id);
    setUploading(false);
    if (res.ok) onAvatarChange?.(res.url);
    else if (res.error !== "Annulé.") Alert.alert("Photo", res.error);
  };

  return (
    <View
      style={{
        padding: 18,
        borderRadius: radii.lg,
        backgroundColor: t.brand,
        position: "relative",
        overflow: "hidden",
        shadowColor: t.brand,
        shadowOpacity: 0.25,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
      }}
    >
      <Svg
        width={160}
        height={160}
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth={1}
        style={{ position: "absolute", top: -20, right: -20, opacity: 0.18 }}
      >
        <Path d="M3 10l9-5 9 5-9 5-9-5zM5 12v6c0 1 3 3 7 3s7-2 7-3v-6" />
      </Svg>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Pressable onPress={onPickPhoto} disabled={uploading} style={{ opacity: uploading ? 0.6 : 1 }}>
          <Avatar
            name={child.name}
            url={child.avatarUrl}
            size={52}
            style={{ backgroundColor: "rgba(255,255,255,0.15)", borderWidth: 2, borderColor: "rgba(255,255,255,0.3)" }}
          />
          {uploading && (
            <ActivityIndicator size="small" color="white" style={{ position: "absolute", top: 16, left: 16 }} />
          )}
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, color: "white", opacity: 0.85, fontWeight: "600", letterSpacing: 0.6, textTransform: "uppercase", fontFamily: fonts.body }}>
            <T fr="Mon enfant" en="My child" />
          </Text>
          <Text style={{ fontSize: 18, color: "white", fontWeight: "700", fontFamily: fonts.display }}>{child.name}</Text>
          <Text style={{ fontSize: 12, color: "white", opacity: 0.85, marginTop: 1, fontFamily: fonts.body }}>
            {[child.grade, child.option, child.school].filter(Boolean).join(" · ")}
          </Text>
        </View>
      </View>
      <View style={{ marginTop: 16 }}>
        <Text style={{ fontSize: 11, color: "white", opacity: 0.85, fontWeight: "600", fontFamily: fonts.body }}>
          <T fr="Moyenne générale" en="Overall average" />
        </Text>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6, marginTop: 4 }}>
          <Text style={{ fontSize: 36, color: "white", fontWeight: "700", fontFamily: fonts.display, letterSpacing: -1 }}>{child.avg}</Text>
          <Text style={{ fontSize: 14, color: "white", opacity: 0.85, fontFamily: fonts.body }}>/20</Text>
        </View>
        {child.rank != null && child.total != null && (
          <Text style={{ fontSize: 11, color: "white", opacity: 0.85, marginTop: 6, fontFamily: fonts.body }}>
            <T fr={`Rang ${child.rank} sur ${child.total}`} en={`Rank ${child.rank} of ${child.total}`} />
          </Text>
        )}
      </View>
    </View>
  );
}

function SectionTitle({ title, action }: { title: { fr: string; en: string }; action?: { fr: string; en: string; onPress: () => void } }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginTop: 4 }}>
      <Text style={{ fontSize: 14, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold }}>
        <T fr={title.fr} en={title.en} />
      </Text>
      {action && (
        <Pressable onPress={action.onPress}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: t.brand600, fontFamily: fonts.bodyBold }}>
            <T fr={action.fr} en={action.en} />
          </Text>
        </Pressable>
      )}
    </View>
  );
}

// Couleur + code court d'une matière, dérivés de son nom (sans données fictives).
const SUBJECT_COLORS = ["#1E2F6D", "#D99A00", "#1D6650", "#3A6DBC", "#C0392B", "#8E44AD", "#16A085", "#E67E22"];
export function subjectVisual(name: string): { short: string; color: string } {
  const n = name || "?";
  const short = n.slice(0, 3).toUpperCase();
  let h = 0;
  for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0;
  return { short, color: SUBJECT_COLORS[h % SUBJECT_COLORS.length] };
}

export function GradeRow({ g }: { g: Grade }) {
  const t = useTheme();
  const subj = subjectVisual(g.subject);
  const pct = g.score / g.max;
  const toneColor = pct >= 0.75 ? t.accent : pct >= 0.5 ? t.warning : t.danger;
  return (
    <Card style={{ padding: 12, flexDirection: "row", alignItems: "center", gap: 12 }}>
      <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: subj.color + "22", alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: subj.color, fontWeight: "700", fontSize: 11, fontFamily: fonts.displayMedium }}>{subj.short}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13.5, fontWeight: "600", color: t.ink, fontFamily: fonts.bodyBold }} numberOfLines={1}>
          {g.kind}
        </Text>
        <Text style={{ fontSize: 11.5, color: t.ink3, marginTop: 2, fontFamily: fonts.body }}>
          {g.subject} · {g.date}
        </Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <View style={{ flexDirection: "row", alignItems: "baseline" }}>
          <Text style={{ fontSize: 18, fontWeight: "700", fontFamily: fonts.display, color: toneColor, letterSpacing: -0.5 }}>{g.score}</Text>
          <Text style={{ fontSize: 11, color: t.ink3, fontWeight: "600", fontFamily: fonts.body }}>/{g.max}</Text>
        </View>
        <Text style={{ fontSize: 10, color: t.ink3, marginTop: 1, fontFamily: fonts.body }}>coef. {g.coef}</Text>
      </View>
    </Card>
  );
}

export function HomeworkCard({ hw }: { hw: Homework }) {
  const t = useTheme();
  const subj = subjectVisual(hw.subject);
  return (
    <Card style={{ padding: 14 }}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
        <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: subj.color + "22", alignItems: "center", justifyContent: "center" }}>
          <Icon name="file" size={18} color={subj.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13.5, fontWeight: "600", color: t.ink, fontFamily: fonts.bodyBold }}>{hw.title}</Text>
          <Text style={{ fontSize: 11.5, color: t.ink3, marginTop: 2, fontFamily: fonts.body }}>
            {hw.subject} · {hw.teacher}
          </Text>
          <View style={{ marginTop: 10, flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Chip tone="warn" icon={<Icon name="clock" size={11} color={t.warning} />} label={hw.due} />
            <Pressable style={{ marginLeft: "auto", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: t.brandSoft }}>
              <Text style={{ color: t.brand600, fontSize: 12, fontWeight: "600", fontFamily: fonts.bodyBold }}>
                <T fr="Voir" en="Open" /> →
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Card>
  );
}

// Kept for backwards-compat with messages.tsx which used to import MessageRow.
export { Card } from "@/components/Card";
