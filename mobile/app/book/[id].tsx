import { View, Text, ScrollView, Pressable, ActivityIndicator, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";

import { Icon } from "@/components/Icon";
import { useTheme, fonts, radii } from "@/lib/theme";
import { T } from "@/lib/i18n";
import { getBook, type LibraryBook } from "@/lib/db";

export default function BookDetail() {
  const t = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [book, setBook] = useState<LibraryBook | null | "loading">("loading");

  useEffect(() => {
    if (!id) return;
    getBook(String(id)).then(setBook).catch(() => setBook(null));
  }, [id]);

  if (book === "loading") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={t.brand} />
      </SafeAreaView>
    );
  }

  if (!book) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Text style={{ color: t.ink3, fontFamily: fonts.body }}>
          <T fr="Livre introuvable." en="Book not found." />
        </Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 14 }}>
          <Text style={{ color: t.brand600, fontWeight: "600", fontFamily: fonts.bodyBold }}>← Retour</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const bgColor = book.subjectColor ?? t.brand;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={["top"]}>
      {/* Header avec bouton retour */}
      <View style={{ paddingVertical: 8, paddingHorizontal: 12, flexDirection: "row", alignItems: "center" }}>
        <Pressable
          onPress={() => router.back()}
          style={{ width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" }}
        >
          <Icon name="chevL" size={20} color={t.ink2} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Cover hero */}
        <View
          style={{
            alignItems: "center",
            padding: 24,
            backgroundColor: bgColor + "11",
          }}
        >
          <View
            style={{
              width: 160,
              height: 220,
              borderRadius: 8,
              backgroundColor: bgColor + "22",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              shadowColor: "#000",
              shadowOpacity: 0.15,
              shadowRadius: 14,
              shadowOffset: { width: 0, height: 8 },
              elevation: 8,
            }}
          >
            {book.coverUrl ? (
              <Image source={{ uri: book.coverUrl }} style={{ width: 160, height: 220 }} resizeMode="cover" />
            ) : (
              <Icon name="book" size={64} color={bgColor} />
            )}
          </View>
        </View>

        {/* Infos */}
        <View style={{ paddingHorizontal: 24, paddingTop: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 }}>
            {book.subjectName && (
              <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: bgColor + "22" }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: bgColor }}>{book.subjectName}</Text>
              </View>
            )}
            {book.gradeLevel && (
              <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: t.surface2 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: t.ink2 }}>{book.gradeLevel}</Text>
              </View>
            )}
          </View>

          <Text style={{ fontSize: 24, fontWeight: "700", color: t.ink, fontFamily: fonts.display, letterSpacing: -0.5, lineHeight: 30 }}>
            {book.title}
          </Text>
          <Text style={{ fontSize: 14, color: t.ink3, marginTop: 4, fontFamily: fonts.body }}>
            {book.author}
            {book.publishedYear ? ` · ${book.publishedYear}` : ""}
          </Text>

          {book.description && (
            <View style={{ marginTop: 20 }}>
              <Text style={{ fontSize: 11, color: t.ink3, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase", fontFamily: fonts.body }}>
                <T fr="Description" en="Description" />
              </Text>
              <Text style={{ fontSize: 14, color: t.ink2, marginTop: 8, lineHeight: 21, fontFamily: fonts.body }}>
                {book.description}
              </Text>
            </View>
          )}

          <View
            style={{
              marginTop: 24,
              padding: 14,
              borderRadius: radii.md,
              backgroundColor: t.surface,
              borderWidth: 1,
              borderColor: t.border,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: t.brandSoft, alignItems: "center", justifyContent: "center" }}>
              <Icon name="user" size={16} color={t.brand600} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, color: t.ink3, fontFamily: fonts.body }}>
                <T fr="Recommandé par" en="Recommended by" />
              </Text>
              <Text style={{ fontSize: 13.5, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold }}>{book.addedBy}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
