// Emploi du temps — créneaux de la classe de l'enfant, groupés par jour.

import { View, Text, ScrollView, ActivityIndicator } from "react-native";
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

export default function EmploiDuTemps() {
  const t = useTheme();
  const tr = useT();
  const { selectedChild } = useChildren();
  const [slots, setSlots] = useState<TimetableSlot[] | null>(null);

  useEffect(() => {
    if (!selectedChild) {
      setSlots([]);
      return;
    }
    setSlots(null);
    listTimetable(selectedChild.grade, selectedChild.schoolId).then(setSlots).catch(() => setSlots([]));
  }, [selectedChild?.id]);

  const byDay = useMemo(() => {
    const m = new Map<number, TimetableSlot[]>();
    for (const s of slots ?? []) {
      if (!m.has(s.day)) m.set(s.day, []);
      m.get(s.day)!.push(s);
    }
    return [...m.entries()].sort((a, b) => a[0] - b[0]);
  }, [slots]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={["top", "bottom"]}>
      <ScreenHeader title={tr({ fr: "Emploi du temps", en: "Timetable" })} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
        {selectedChild && (
          <View style={{ gap: 2 }}>
            {!!selectedChild.school && (
              <Text style={{ fontSize: 15, fontWeight: "700", color: t.brand600, fontFamily: fonts.displayMedium }}>
                {selectedChild.school}
              </Text>
            )}
            <Text style={{ fontSize: 13, color: t.ink3, fontFamily: fonts.body }}>
              {selectedChild.name} · {[selectedChild.grade, selectedChild.option].filter(Boolean).join(" · ")}
            </Text>
          </View>
        )}

        {slots === null ? (
          <ActivityIndicator color={t.brand} style={{ marginTop: 30 }} />
        ) : byDay.length === 0 ? (
          <Card style={{ padding: 26, alignItems: "center", gap: 8 }}>
            <Icon name="calendar" size={30} color={t.ink3} />
            <Text style={{ fontSize: 13, color: t.ink3, textAlign: "center", fontFamily: fonts.body }}>
              <T fr="L'emploi du temps n'a pas encore été publié par l'école." en="The school hasn't published the timetable yet." />
            </Text>
          </Card>
        ) : (
          byDay.map(([day, list]) => (
            <View key={day} style={{ gap: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold }}>{DAYS[day - 1]}</Text>
              {list.map((s) => (
                <Card key={s.id} style={{ padding: 12, flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View style={{ width: 62, alignItems: "center" }}>
                    <Text style={{ fontSize: 12.5, fontWeight: "700", color: t.brand600, fontFamily: fonts.displayMedium }}>{s.startTime}</Text>
                    <Text style={{ fontSize: 10.5, color: t.ink3, fontFamily: fonts.body }}>{s.endTime}</Text>
                  </View>
                  <View style={{ width: 1, alignSelf: "stretch", backgroundColor: t.divider }} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold }}>{s.subject}</Text>
                    {(s.teacher || s.room) && (
                      <Text style={{ fontSize: 12, color: t.ink3, marginTop: 1, fontFamily: fonts.body }}>
                        {[s.teacher, s.room].filter(Boolean).join(" · ")}
                      </Text>
                    )}
                  </View>
                </Card>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
