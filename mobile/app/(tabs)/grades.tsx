import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";

import { Card } from "@/components/Card";
import { GradeRing } from "@/components/Charts";
import { ChildSwitcher } from "@/components/ChildSwitcher";
import { Icon } from "@/components/Icon";
import { useTheme, fonts } from "@/lib/theme";
import { T, useT } from "@/lib/i18n";
import { useChildren } from "@/lib/children";
import { type Subject } from "@/lib/mock";
import { listTrimester, type TrimesterReport } from "@/lib/db";
import { TRIMESTERS, currentTrimester, trimesterMeta } from "@/lib/trimester";

export default function Grades() {
  const t = useTheme();
  const tr = useT();
  const [period, setPeriod] = useState<number>(currentTrimester());
  const { selectedChild: child, loading: childrenLoading } = useChildren();
  const [report, setReport] = useState<TrimesterReport>({ subjects: [], overallAvg: 0, count: 0 });
  const [dataReady, setDataReady] = useState(false);

  useEffect(() => {
    if (!child) {
      setReport({ subjects: [], overallAvg: 0, count: 0 });
      setDataReady(true);
      return;
    }
    setDataReady(false);
    listTrimester(child.id, period).then((r) => {
      setReport(r);
      setDataReady(true);
    });
  }, [child?.id, period]);

  const subjects: Subject[] = report.subjects;
  const periodMeta = trimesterMeta(period);

  const ready = !childrenLoading && (child ? dataReady : true);

  if (!ready) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={t.brand} />
      </SafeAreaView>
    );
  }

  if (!child) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg, alignItems: "center", justifyContent: "center", padding: 32 }}>
        <Text style={{ fontSize: 13.5, color: t.ink3, textAlign: "center", fontFamily: fonts.body, lineHeight: 20 }}>
          {tr({ fr: "Aucun enfant lié. Contactez l'école.", en: "No child linked. Contact your school." })}
        </Text>
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

        <ChildSwitcher style={{ paddingBottom: 4 }} />

        <View style={{ paddingHorizontal: 20, paddingVertical: 12 }}>
          <View style={{ flexDirection: "row", backgroundColor: t.surface2, borderRadius: 12, padding: 4 }}>
            {TRIMESTERS.map((p) => {
              const on = period === p.index;
              const isCurrent = currentTrimester() === p.index;
              return (
                <Pressable
                  key={p.index}
                  onPress={() => setPeriod(p.index)}
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
                    {p.short}
                  </Text>
                  {isCurrent && (
                    <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: t.brand, marginTop: 3 }} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, paddingBottom: 20, gap: 14 }}>
          <Card style={{ padding: 18, flexDirection: "row", alignItems: "center", gap: 16 }}>
            <GradeRing value={report.overallAvg} size={72} stroke={7} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, color: t.ink3, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase", fontFamily: fonts.body }}>
                {tr({ fr: `Moyenne ${periodMeta.fr}`, en: `${periodMeta.en} average` })}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6, marginTop: 2 }}>
                <Text style={{ fontSize: 32, fontWeight: "700", color: t.ink, fontFamily: fonts.display, letterSpacing: -0.8 }}>{report.overallAvg}</Text>
                <Text style={{ fontSize: 14, color: t.ink3, fontFamily: fonts.body }}>/20</Text>
              </View>
              <Text style={{ fontSize: 11, color: t.ink3, marginTop: 6, fontFamily: fonts.body }}>
                {tr({ fr: `${report.count} cotation(s)`, en: `${report.count} grade(s)` })}
              </Text>
            </View>
          </Card>

          {report.count === 0 ? (
            <Text style={{ textAlign: "center", color: t.ink3, fontSize: 13, paddingVertical: 24, fontFamily: fonts.body }}>
              {tr({ fr: "Aucune note pour ce trimestre.", en: "No grades for this term." })}
            </Text>
          ) : (
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
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
