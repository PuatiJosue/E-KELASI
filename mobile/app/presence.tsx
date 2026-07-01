// Présence — calendrier mensuel des présences de l'enfant sélectionné.

import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useMemo, useState } from "react";

import { ScreenHeader } from "@/components/ScreenHeader";
import { Card } from "@/components/Card";
import { Icon } from "@/components/Icon";
import { useTheme, fonts, radii } from "@/lib/theme";
import { T, useT } from "@/lib/i18n";
import { useChildren } from "@/lib/children";
import { listChildAttendance, type AttendanceRecord } from "@/lib/db";

const STATUS: Record<string, { color: string; fr: string; en: string }> = {
  present: { color: "#16A34A", fr: "Présent", en: "Present" },
  late: { color: "#D97706", fr: "Retard", en: "Late" },
  absent: { color: "#E11D48", fr: "Absent", en: "Absent" },
  justified: { color: "#4F66E8", fr: "Justifié", en: "Excused" },
};
const WEEK = ["L", "M", "M", "J", "V", "S", "D"];
const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

export default function Presence() {
  const t = useTheme();
  const tr = useT();
  const { selectedChild } = useChildren();
  const [records, setRecords] = useState<AttendanceRecord[] | null>(null);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  useEffect(() => {
    if (!selectedChild) {
      setRecords([]);
      return;
    }
    setRecords(null);
    listChildAttendance(selectedChild.id).then(setRecords).catch(() => setRecords([]));
  }, [selectedChild?.id]);

  // Map date -> statut.
  const byDate = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of records ?? []) m.set(r.date, r.status);
    return m;
  }, [records]);

  const y = month.getFullYear();
  const mo = month.getMonth();
  const daysInMonth = new Date(y, mo + 1, 0).getDate();
  const firstWeekday = (new Date(y, mo, 1).getDay() + 6) % 7; // Lundi = 0

  // Compteurs du mois affiché.
  const counts = useMemo(() => {
    const c = { present: 0, late: 0, absent: 0, justified: 0, total: 0 };
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${y}-${String(mo + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const st = byDate.get(key);
      if (st && st in c) {
        (c as any)[st] += 1;
        c.total += 1;
      }
    }
    return c;
  }, [byDate, y, mo, daysInMonth]);

  const attended = counts.present + counts.late + counts.justified;
  const rate = counts.total > 0 ? Math.round((attended / counts.total) * 100) : null;

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={["top", "bottom"]}>
      <ScreenHeader title={tr({ fr: "Présence", en: "Attendance" })} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
        {selectedChild && (
          <Text style={{ fontSize: 13, color: t.ink3, fontFamily: fonts.body }}>
            {selectedChild.name} · {[selectedChild.grade, selectedChild.option].filter(Boolean).join(" · ")}
          </Text>
        )}

        {records === null ? (
          <ActivityIndicator color={t.brand} style={{ marginTop: 30 }} />
        ) : (
          <>
            {/* Sélecteur de mois */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Pressable onPress={() => setMonth(new Date(y, mo - 1, 1))} hitSlop={10} style={{ padding: 6 }}>
                <Icon name="chevL" size={20} color={t.ink2} />
              </Pressable>
              <Text style={{ fontSize: 15, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold }}>
                {MONTHS[mo]} {y}
              </Text>
              <Pressable onPress={() => setMonth(new Date(y, mo + 1, 1))} hitSlop={10} style={{ padding: 6 }}>
                <Icon name="chevR" size={20} color={t.ink2} />
              </Pressable>
            </View>

            {/* Calendrier */}
            <Card style={{ padding: 12 }}>
              <View style={{ flexDirection: "row", marginBottom: 6 }}>
                {WEEK.map((w, i) => (
                  <Text key={i} style={{ flex: 1, textAlign: "center", fontSize: 11, fontWeight: "700", color: t.ink3, fontFamily: fonts.body }}>{w}</Text>
                ))}
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {cells.map((d, i) => {
                  if (d === null) return <View key={i} style={{ width: `${100 / 7}%`, height: 40 }} />;
                  const key = `${y}-${String(mo + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                  const st = byDate.get(key);
                  const meta = st ? STATUS[st] : null;
                  return (
                    <View key={i} style={{ width: `${100 / 7}%`, height: 40, alignItems: "center", justifyContent: "center" }}>
                      <View style={{ width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: meta ? meta.color + "22" : "transparent" }}>
                        <Text style={{ fontSize: 13, fontWeight: meta ? "700" : "500", color: meta ? meta.color : t.ink3, fontFamily: fonts.body }}>{d}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </Card>

            {/* Taux + légende */}
            <Card style={{ padding: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 13.5, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold }}>
                  <T fr="Taux de présence" en="Attendance rate" />
                </Text>
                <Text style={{ fontSize: 22, fontWeight: "700", color: rate != null && rate >= 90 ? t.accent : rate != null && rate >= 75 ? t.warning : t.ink, fontFamily: fonts.display }}>
                  {rate != null ? `${rate}%` : "—"}
                </Text>
              </View>
              {counts.total === 0 && (
                <Text style={{ fontSize: 12, color: t.ink3, marginTop: 6, fontFamily: fonts.body }}>
                  <T fr="Aucune présence enregistrée ce mois-ci." en="No attendance recorded this month." />
                </Text>
              )}
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 12 }}>
                {(["present", "late", "absent", "justified"] as const).map((k) => (
                  <View key={k} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: STATUS[k].color }} />
                    <Text style={{ fontSize: 12, color: t.ink2, fontFamily: fonts.body }}>
                      <T fr={STATUS[k].fr} en={STATUS[k].en} /> · {(counts as any)[k]}
                    </Text>
                  </View>
                ))}
              </View>
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
