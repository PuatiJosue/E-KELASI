import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";

import { Card, Chip } from "@/components/Card";
import { GradeRing } from "@/components/Charts";
import { Icon } from "@/components/Icon";
import { useTheme, fonts } from "@/lib/theme";
import { T, useT } from "@/lib/i18n";
import { type Subject } from "@/lib/mock";
import { getChild, listSubjects, type Child } from "@/lib/db";

const PERIODS = [
  { id: "t1", fr: "T1", en: "T1" },
  { id: "t2", fr: "T2", en: "T2" },
  { id: "t3", fr: "T3", en: "T3" },
  { id: "all", fr: "Année", en: "Year" },
] as const;

export default function Grades() {
  const t = useTheme();
  const tr = useT();
  const [period, setPeriod] = useState<(typeof PERIODS)[number]["id"]>("t2");
  const [child, setChild] = useState<Child | null>(null);
  const [subjects, setSubjects] = useState<Subject[] | null>(null);

  useEffect(() => {
    Promise.all([getChild(), listSubjects()]).then(([c, s]) => {
      setChild(c);
      setSubjects(s);
    });
  }, []);

  if (!child || !subjects) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={t.brand} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
          <Text style={{ fontSize: 11, color: t.ink3, fontWeight: "600", letterSpacing: 0.6, textTransform: "uppercase", fontFamily: fonts.body }}>
            <T fr="Bulletin" en="Report card" />
          </Text>
          <Text style={{ fontSize: 26, fontWeight: "700", color: t.ink, fontFamily: fonts.display, letterSpacing: -0.7 }}>
            <T fr="Notes & moyennes" en="Grades & averages" />
          </Text>
        </View>

        <View style={{ paddingHorizontal: 20, paddingVertical: 12 }}>
          <View style={{ flexDirection: "row", backgroundColor: t.surface2, borderRadius: 12, padding: 4 }}>
            {PERIODS.map((p) => {
              const on = period === p.id;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => setPeriod(p.id)}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    borderRadius: 9,
                    backgroundColor: on ? t.surface : "transparent",
                    alignItems: "center",
                    shadowColor: "#000",
                    shadowOpacity: on ? 0.06 : 0,
                    shadowRadius: 2,
                    shadowOffset: { width: 0, height: 1 },
                    elevation: on ? 1 : 0,
                  }}
                >
                  <Text style={{ fontSize: 12.5, fontWeight: "600", color: on ? t.ink : t.ink3, fontFamily: fonts.bodyBold }}>
                    {tr({ fr: p.fr, en: p.en })}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, paddingBottom: 20, gap: 14 }}>
          <Card style={{ padding: 18, flexDirection: "row", alignItems: "center", gap: 16 }}>
            <GradeRing value={child.avg} size={72} stroke={7} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, color: t.ink3, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase", fontFamily: fonts.body }}>
                <T fr="Moyenne T2" en="Term 2 average" />
              </Text>
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6, marginTop: 2 }}>
                <Text style={{ fontSize: 32, fontWeight: "700", color: t.ink, fontFamily: fonts.display, letterSpacing: -0.8 }}>{child.avg}</Text>
                <Text style={{ fontSize: 14, color: t.ink3, fontFamily: fonts.body }}>/20</Text>
              </View>
              <View style={{ marginTop: 6, flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Chip
                  tone="success"
                  icon={<Icon name="arrowUp" size={11} color={t.accent} />}
                  label={`+0.4 ${tr({ fr: "vs T1", en: "vs T1" })}`}
                />
                <Text style={{ fontSize: 11, color: t.ink3, fontFamily: fonts.body }}>
                  <T fr="Classement" en="Rank" /> {child.rank}/{child.total}
                </Text>
              </View>
            </View>
          </Card>

          <Card style={{ padding: 4 }}>
            {subjects.map((s, i) => (
              <View
                key={s.name}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  borderBottomWidth: i < subjects.length - 1 ? 1 : 0,
                  borderBottomColor: t.divider,
                }}
              >
                <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: s.color + "22", alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ color: s.color, fontSize: 11, fontWeight: "700", fontFamily: fonts.displayMedium }}>{s.short}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13.5, fontWeight: "600", color: t.ink, fontFamily: fonts.bodyBold }}>{s.name}</Text>
                  <View style={{ marginTop: 4, height: 4, borderRadius: 2, backgroundColor: t.surface2, overflow: "hidden" }}>
                    <View style={{ height: "100%", width: `${(s.grade / 20) * 100}%`, backgroundColor: s.color, borderRadius: 2 }} />
                  </View>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                    <Text style={{ fontSize: 16, fontWeight: "700", color: t.ink, fontFamily: fonts.display }}>{s.grade.toFixed(1)}</Text>
                    <Text style={{ fontSize: 10, color: t.ink3, fontWeight: "600", fontFamily: fonts.body }}>/20</Text>
                  </View>
                  {s.trend !== 0 && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                      <Icon name={s.trend >= 0 ? "arrowUp" : "arrowDn"} size={10} color={s.trend >= 0 ? t.accent : t.danger} />
                      <Text style={{ fontSize: 10.5, color: s.trend >= 0 ? t.accent : t.danger, fontWeight: "600", fontFamily: fonts.bodyBold }}>
                        {s.trend >= 0 ? "+" : ""}{s.trend.toFixed(1)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
