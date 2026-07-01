import { View, Text, ScrollView, Pressable, ActivityIndicator, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useEffect, useState, useMemo } from "react";

import { Card } from "@/components/Card";
import { Icon } from "@/components/Icon";
import { useTheme, fonts, radii } from "@/lib/theme";
import { T, useT } from "@/lib/i18n";
import { listLibrary, type LibraryBook } from "@/lib/db";

export default function Library() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const [books, setBooks] = useState<LibraryBook[] | null>(null);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    listLibrary().then(setBooks).catch(() => setBooks([]));
  }, []);

  const subjects = useMemo(() => {
    if (!books) return [];
    const set = new Set<string>();
    books.forEach((b) => {
      if (b.subjectName) set.add(b.subjectName);
    });
    return Array.from(set).sort();
  }, [books]);

  const filtered = useMemo(() => {
    if (!books) return [];
    if (filter === "all") return books;
    return books.filter((b) => b.subjectName === filter);
  }, [books, filter]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
          <Text style={{ fontSize: 11, color: t.ink3, fontWeight: "600", letterSpacing: 0.6, textTransform: "uppercase", fontFamily: fonts.body }}>
            <T fr="Recommandés par les profs" en="Teacher picks" />
          </Text>
          <Text style={{ fontSize: 26, fontWeight: "700", color: t.ink, fontFamily: fonts.display, letterSpacing: -0.7 }}>
            <T fr="Bibliothèque" en="Library" />
          </Text>
        </View>

        {/* Filter chips */}
        {subjects.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 8, gap: 8 }}
          >
            {[{ id: "all", label: tr({ fr: "Toutes", en: "All" }) }, ...subjects.map((s) => ({ id: s, label: s }))].map(
              (f) => {
                const on = filter === f.id;
                return (
                  <Pressable
                    key={f.id}
                    onPress={() => setFilter(f.id)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 7,
                      borderRadius: 999,
                      backgroundColor: on ? t.ink : t.surface,
                      borderWidth: 1,
                      borderColor: on ? t.ink : t.border,
                    }}
                  >
                    <Text style={{ fontSize: 12.5, color: on ? t.surface : t.ink2, fontWeight: "600", fontFamily: fonts.bodyBold }}>
                      {f.label}
                    </Text>
                  </Pressable>
                );
              }
            )}
          </ScrollView>
        )}

        {books === null ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <ActivityIndicator color={t.brand} />
          </View>
        ) : filtered.length === 0 ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <Icon name="book" size={36} color={t.ink4} />
            <Text style={{ marginTop: 12, fontSize: 13, color: t.ink3, fontFamily: fonts.body, textAlign: "center" }}>
              <T fr="Aucun livre pour cette sélection." en="No books for this filter." />
            </Text>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 20, gap: 12 }}>
            {filtered.map((b) => (
              <Pressable
                key={b.id}
                onPress={() => router.push(`/book/${b.id}`)}
                style={{
                  backgroundColor: t.surface,
                  borderRadius: radii.lg,
                  borderWidth: 1,
                  borderColor: t.border,
                  flexDirection: "row",
                  overflow: "hidden",
                  shadowColor: "#140A06",
                  shadowOpacity: 0.05,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 2,
                }}
              >
                <View
                  style={{
                    width: 90,
                    height: 130,
                    backgroundColor: (b.subjectColor ?? t.brand) + "22",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {b.coverUrl ? (
                    <Image source={{ uri: b.coverUrl }} style={{ width: 90, height: 130 }} resizeMode="cover" />
                  ) : (
                    <Icon name="book" size={32} color={b.subjectColor ?? t.brand} />
                  )}
                  {/* Badge prix / possession */}
                  <View style={{ position: "absolute", top: 6, left: 6, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999, backgroundColor: b.owned ? "#16A34A" : "rgba(15,18,30,0.78)" }}>
                    <Text style={{ fontSize: 9.5, fontWeight: "800", color: "white" }}>
                      {b.owned ? (b.priceCents > 0 ? "Acheté" : "Gratuit") : `${(b.priceCents / 100).toFixed(2)} ${b.currency}`}
                    </Text>
                  </View>
                </View>
                <View style={{ flex: 1, padding: 14 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    {b.subjectName && (
                      <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: (b.subjectColor ?? t.brand) + "22" }}>
                        <Text style={{ fontSize: 10, fontWeight: "700", color: b.subjectColor ?? t.brand }}>{b.subjectName}</Text>
                      </View>
                    )}
                    {b.gradeLevel && (
                      <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: t.surface2 }}>
                        <Text style={{ fontSize: 10, fontWeight: "700", color: t.ink2 }}>{b.gradeLevel}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: t.ink, fontFamily: fonts.display, lineHeight: 18 }} numberOfLines={2}>
                    {b.title}
                  </Text>
                  <Text style={{ fontSize: 12, color: t.ink3, marginTop: 2, fontFamily: fonts.body }}>{b.author}</Text>
                  {b.description && (
                    <Text style={{ fontSize: 11.5, color: t.ink2, marginTop: 6, lineHeight: 16, fontFamily: fonts.body }} numberOfLines={2}>
                      {b.description}
                    </Text>
                  )}
                  <Text style={{ fontSize: 10.5, color: t.ink3, marginTop: 6, fontFamily: fonts.body }}>
                    <T fr="par" en="by" /> <Text style={{ color: t.ink2, fontWeight: "600" }}>{b.addedBy}</Text>
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
