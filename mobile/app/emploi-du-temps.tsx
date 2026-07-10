// Emploi du temps — calendrier hebdomadaire : jours en colonnes, axe horaire
// vertical, cours en blocs colorés (hauteur = durée). Publié par l'école.

import { View, Text, ScrollView, ActivityIndicator, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useMemo, useState } from "react";

import { ScreenHeader } from "@/components/ScreenHeader";
import { Card } from "@/components/Card";
import { Icon } from "@/components/Icon";
import { useTheme, fonts } from "@/lib/theme";
import { T, useT } from "@/lib/i18n";
import { useChildren } from "@/lib/children";
import { listTimetable, type TimetableSlot } from "@/lib/db";

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const PALETTE = ["#7C6CF0", "#E8823C", "#2FA8C0", "#3FA663", "#E0518A", "#4F86E8", "#D9A03A", "#C0553C", "#5B8DEF", "#9C6ADE", "#2E8B7A", "#B23B6E"];

const HOUR_PX = 56;
const DAY_HEAD = 50;
const COL_W = 116;
const GUTTER = 46;

const toMin = (t: string) => {
  const [h, m] = (t || "0:0").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};
function courseColor(s: { color: string | null; subject: string }) {
  if (s.color) return s.color;
  let h = 0;
  for (let i = 0; i < s.subject.length; i++) h = (h * 31 + s.subject.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
function readableText(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return "#fff";
  const n = parseInt(m[1], 16);
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.62 ? "#1b1f2e" : "#fff";
}
function mondayOf(base: Date) {
  const d = new Date(base);
  const wd = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - wd);
  d.setHours(0, 0, 0, 0);
  return d;
}
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const fmtDay = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;

export default function EmploiDuTemps() {
  const t = useTheme();
  const tr = useT();
  const { selectedChild } = useChildren();
  const [slots, setSlots] = useState<TimetableSlot[] | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    if (!selectedChild) { setSlots([]); return; }
    setSlots(null);
    listTimetable(selectedChild.grade, selectedChild.schoolId).then(setSlots).catch(() => setSlots([]));
  }, [selectedChild?.id]);

  const valid = useMemo(
    () => (slots ?? []).filter((s) => s.startTime && s.endTime && s.subject.trim() && toMin(s.endTime) > toMin(s.startTime)),
    [slots]
  );

  const layout = useMemo(() => {
    if (valid.length === 0) return null;
    const maxDay = Math.max(5, ...valid.map((s) => s.day));
    const days = Array.from({ length: maxDay }, (_, i) => i + 1);
    const minH = Math.floor(Math.min(...valid.map((s) => toMin(s.startTime))) / 60);
    const maxH = Math.ceil(Math.max(...valid.map((s) => toMin(s.endTime))) / 60);
    const hours = Array.from({ length: maxH - minH + 1 }, (_, i) => minH + i);
    return { days, minMin: minH * 60, totalH: (maxH - minH) * HOUR_PX, hours, minH };
  }, [valid]);

  const monday = addDays(mondayOf(new Date()), weekOffset * 7);
  const rangeLabel = `${fmtDay(monday)} – ${fmtDay(addDays(monday, 6))} ${addDays(monday, 6).getFullYear()}`;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={["top", "bottom"]}>
      <ScreenHeader title={tr({ fr: "Emploi du temps", en: "Timetable" })} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        {selectedChild && (
          <View style={{ gap: 2 }}>
            {!!selectedChild.school && (
              <Text style={{ fontSize: 15, fontWeight: "700", color: t.brand600, fontFamily: fonts.displayMedium }}>{selectedChild.school}</Text>
            )}
            <Text style={{ fontSize: 13, color: t.ink3, fontFamily: fonts.body }}>
              {selectedChild.name} · {[selectedChild.grade, selectedChild.option].filter(Boolean).join(" · ")}
            </Text>
          </View>
        )}

        {slots === null ? (
          <ActivityIndicator color={t.brand} style={{ marginTop: 30 }} />
        ) : valid.length === 0 || !layout ? (
          <Card style={{ padding: 26, alignItems: "center", gap: 8 }}>
            <Icon name="calendar" size={30} color={t.ink3} />
            <Text style={{ fontSize: 13, color: t.ink3, textAlign: "center", fontFamily: fonts.body }}>
              <T fr="L'emploi du temps n'a pas encore été publié par l'école." en="The school hasn't published the timetable yet." />
            </Text>
          </Card>
        ) : (
          <>
            {/* Navigation par semaine */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 14, paddingVertical: 4 }}>
              <Pressable onPress={() => setWeekOffset((w) => w - 1)} hitSlop={10} style={{ padding: 6, borderRadius: 8, backgroundColor: t.surface2 }}>
                <Icon name="chevL" size={18} color={t.ink} />
              </Pressable>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Icon name="calendar" size={15} color={t.brand600} />
                <Text style={{ fontSize: 14, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold }}>{rangeLabel}</Text>
              </View>
              <Pressable onPress={() => setWeekOffset((w) => w + 1)} hitSlop={10} style={{ padding: 6, borderRadius: 8, backgroundColor: t.surface2 }}>
                <Icon name="chevR" size={18} color={t.ink} />
              </Pressable>
            </View>

            {/* Calendrier */}
            <Card style={{ padding: 0, overflow: "hidden" }}>
              <View style={{ flexDirection: "row" }}>
                {/* Colonne des heures (fixe) */}
                <View style={{ width: GUTTER }}>
                  <View style={{ height: DAY_HEAD }} />
                  <View style={{ height: layout.totalH }}>
                    {layout.hours.map((h) => (
                      <Text key={h} style={{ position: "absolute", top: (h - layout.minH) * HOUR_PX - 6, right: 6, fontSize: 10, color: t.ink3, fontFamily: fonts.body }}>
                        {String(h).padStart(2, "0")}:00
                      </Text>
                    ))}
                  </View>
                </View>

                {/* Colonnes des jours (défilement horizontal) */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: "row" }}>
                    {layout.days.map((d) => {
                      const date = addDays(monday, d - 1);
                      const dayCourses = valid.filter((s) => s.day === d).sort((a, b) => toMin(a.startTime) - toMin(b.startTime));
                      return (
                        <View key={d} style={{ width: COL_W, borderLeftWidth: 1, borderLeftColor: t.divider }}>
                          <View style={{ height: DAY_HEAD, alignItems: "center", justifyContent: "center", gap: 1 }}>
                            <Text style={{ fontSize: 11, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold, textTransform: "uppercase", letterSpacing: 0.3 }}>{DAYS[d - 1]}</Text>
                            <Text style={{ fontSize: 10.5, color: t.brand600, fontFamily: fonts.body }}>{fmtDay(date)}</Text>
                          </View>
                          <View style={{ height: layout.totalH, backgroundColor: t.surface2 }}>
                            {layout.hours.map((h) => (
                              <View key={h} style={{ position: "absolute", top: (h - layout.minH) * HOUR_PX, left: 0, right: 0, borderTopWidth: 1, borderTopColor: t.divider }} />
                            ))}
                            {dayCourses.map((s) => {
                              const top = ((toMin(s.startTime) - layout.minMin) / 60) * HOUR_PX;
                              const height = Math.max(((toMin(s.endTime) - toMin(s.startTime)) / 60) * HOUR_PX - 4, 32);
                              const bg = courseColor(s);
                              const fg = readableText(bg);
                              return (
                                <View key={s.id} style={{ position: "absolute", top: top + 2, left: 4, right: 4, height, backgroundColor: bg, borderRadius: 10, padding: 7, overflow: "hidden" }}>
                                  <Text style={{ fontSize: 9, fontWeight: "600", color: fg, opacity: 0.9, fontFamily: fonts.body }}>{s.startTime} – {s.endTime}</Text>
                                  <Text numberOfLines={2} style={{ fontSize: 12, fontWeight: "700", color: fg, marginTop: 1, fontFamily: fonts.bodyBold }}>{s.subject}</Text>
                                  {!!s.room && (
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 3, marginTop: 3 }}>
                                      <Icon name="pin" size={10} color={fg} />
                                      <Text style={{ fontSize: 10, color: fg, opacity: 0.9, fontFamily: fonts.body }}>{s.room}</Text>
                                    </View>
                                  )}
                                  {!!s.teacher && <Text numberOfLines={1} style={{ fontSize: 9.5, color: fg, opacity: 0.85, marginTop: 1, fontFamily: fonts.body }}>{s.teacher}</Text>}
                                </View>
                              );
                            })}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
