import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";

import { HomeworkCard } from "./index";
import { ChildSwitcher } from "@/components/ChildSwitcher";
import { Icon } from "@/components/Icon";
import { useTheme, fonts } from "@/lib/theme";
import { T, useT } from "@/lib/i18n";
import { useChildren } from "@/lib/children";
import { type Homework } from "@/lib/mock";
import { listHomework } from "@/lib/db";

type Filter = "all" | "todo" | "done";

export default function HomeworkScreen() {
  const t = useTheme();
  const tr = useT();
  const { selectedChild, loading: childrenLoading } = useChildren();
  const [filter, setFilter] = useState<Filter>("all");
  const [items, setItems] = useState<Homework[] | null>(null);

  useEffect(() => {
    if (!selectedChild) {
      setItems([]);
      return;
    }
    setItems(null);
    listHomework(selectedChild.grade, selectedChild.schoolId).then(setItems).catch(() => setItems([]));
  }, [selectedChild?.id]);

  if (childrenLoading || !items) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={t.brand} />
      </SafeAreaView>
    );
  }

  const counts = {
    all: items.length,
    todo: items.filter((h) => h.status === "todo").length,
    done: items.filter((h) => h.status === "done").length,
  };
  const filtered = filter === "all" ? items : items.filter((h) => h.status === filter);

  const filters: Array<{ id: Filter; fr: string; en: string; count: number }> = [
    { id: "all",  fr: "Tous",     en: "All",     count: counts.all },
    { id: "todo", fr: "À faire",  en: "To do",   count: counts.todo },
    { id: "done", fr: "Terminés", en: "Done",    count: counts.done },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, color: t.ink3, fontWeight: "600", letterSpacing: 0.6, textTransform: "uppercase", fontFamily: fonts.body }}>
              <T fr="Devoirs & exercices" en="Homework & exercises" />
            </Text>
            <Text style={{ fontSize: 26, fontWeight: "700", color: t.ink, fontFamily: fonts.display, letterSpacing: -0.7 }}>
              <T fr="Cette semaine" en="This week" />
            </Text>
          </View>
          <Pressable style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, alignItems: "center", justifyContent: "center" }}>
            <Icon name="filter" size={18} color={t.ink2} />
          </Pressable>
        </View>

        <ChildSwitcher style={{ paddingVertical: 4 }} />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 8, gap: 8 }}>
          {filters.map((f) => {
            const on = filter === f.id;
            return (
              <Pressable
                key={f.id}
                onPress={() => setFilter(f.id)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: on ? t.ink : t.surface,
                  borderWidth: 1,
                  borderColor: on ? t.ink : t.border,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Text style={{ fontSize: 12.5, color: on ? t.surface : t.ink2, fontWeight: "600", fontFamily: fonts.bodyBold }}>
                  {tr({ fr: f.fr, en: f.en })}
                </Text>
                <Text style={{ fontSize: 12.5, color: on ? t.surface : t.ink2, opacity: 0.6, fontFamily: fonts.body }}>{f.count}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={{ paddingHorizontal: 20, paddingTop: 6, gap: 10 }}>
          {filtered.length === 0 ? (
            <Text style={{ textAlign: "center", color: t.ink3, fontSize: 13, paddingVertical: 24, fontFamily: fonts.body }}>
              <T fr="Aucun devoir." en="No homework." />
            </Text>
          ) : (
            filtered.map((h, i) => <HomeworkCard key={i} hw={h} />)
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
