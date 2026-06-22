import { View, Text, ScrollView, Pressable, ActivityIndicator, Image, Linking, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import { Icon } from "@/components/Icon";
import { Button } from "@/components/Button";
import { useTheme, fonts, radii } from "@/lib/theme";
import { T, useT } from "@/lib/i18n";
import { getBook, getBookFileUrl, startBookCheckout, createBookMobileMoneyPurchase, type LibraryBook } from "@/lib/db";
import { MobileMoneySheet } from "@/components/MobileMoneySheet";

export default function BookDetail() {
  const t = useTheme();
  const tr = useT();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [book, setBook] = useState<LibraryBook | null | "loading">("loading");
  const [busy, setBusy] = useState(false);
  const [mmVisible, setMmVisible] = useState(false);

  // Recharge le livre (et son statut d'achat) à chaque retour sur l'écran —
  // utile après un paiement Stripe ouvert dans le navigateur.
  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      getBook(String(id)).then(setBook).catch(() => setBook(null));
    }, [id])
  );

  const openFile = async () => {
    if (!id) return;
    setBusy(true);
    const res = await getBookFileUrl(String(id));
    setBusy(false);
    if (res.ok) Linking.openURL(res.url);
    else Alert.alert(tr({ fr: "Indisponible", en: "Unavailable" }), res.error);
  };

  const payCard = async () => {
    if (!id) return;
    setBusy(true);
    const res = await startBookCheckout(String(id));
    setBusy(false);
    if (res.ok) Linking.openURL(res.url);
    else Alert.alert(tr({ fr: "Paiement", en: "Payment" }), res.error);
  };

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
                <T fr="Ajouté par" en="Added by" />
              </Text>
              <Text style={{ fontSize: 13.5, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold }}>{book.addedBy}</Text>
            </View>
          </View>

          {/* Achat / lecture */}
          <View style={{ marginTop: 24, marginBottom: 8 }}>
            {book.owned ? (
              <Button onPress={openFile} disabled={busy} style={{ paddingVertical: 15, borderRadius: 14, opacity: busy ? 0.6 : 1 }}>
                <Text style={{ color: t.onBrand, fontSize: 15, fontWeight: "700", fontFamily: fonts.bodyBold }}>
                  {busy
                    ? tr({ fr: "Ouverture…", en: "Opening…" })
                    : tr({ fr: `Lire / Télécharger${book.fileFormat ? ` (${book.fileFormat.toUpperCase()})` : ""}`, en: `Read / Download${book.fileFormat ? ` (${book.fileFormat.toUpperCase()})` : ""}` })}
                </Text>
              </Button>
            ) : (
              <>
                <View style={{ alignItems: "center", marginBottom: 14 }}>
                  <Text style={{ fontSize: 26, fontWeight: "800", color: t.ink, fontFamily: fonts.display }}>
                    {(book.priceCents / 100).toFixed(2)} {book.currency}
                  </Text>
                  <Text style={{ fontSize: 12, color: t.ink3, fontFamily: fonts.body, marginTop: 2 }}>
                    <T fr="Accès permanent au livre après paiement" en="Permanent access after payment" />
                  </Text>
                </View>
                <Button onPress={payCard} disabled={busy} style={{ paddingVertical: 15, borderRadius: 14, opacity: busy ? 0.6 : 1 }}>
                  <Text style={{ color: t.onBrand, fontSize: 15, fontWeight: "700", fontFamily: fonts.bodyBold }}>
                    {busy ? tr({ fr: "Redirection…", en: "Redirecting…" }) : tr({ fr: "Payer par carte (Stripe)", en: "Pay by card (Stripe)" })}
                  </Text>
                </Button>
                <Pressable
                  onPress={() => setMmVisible(true)}
                  disabled={busy}
                  style={{ marginTop: 10, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: t.border, alignItems: "center" }}
                >
                  <Text style={{ color: t.ink, fontSize: 14.5, fontWeight: "700", fontFamily: fonts.bodyBold }}>
                    <T fr="Payer par Mobile Money" en="Pay with Mobile Money" />
                  </Text>
                </Pressable>
                <Text style={{ fontSize: 11, color: t.ink3, fontFamily: fonts.body, textAlign: "center", marginTop: 10, lineHeight: 16 }}>
                  <T
                    fr="Carte : accès immédiat. Mobile Money : accès dès validation du paiement (sous 24h)."
                    en="Card: instant access. Mobile Money: access once payment is validated (within 24h)."
                  />
                </Text>
              </>
            )}
          </View>
        </View>
      </ScrollView>

      <MobileMoneySheet
          visible={mmVisible}
          title={book.title}
          amountCents={book.priceCents}
          currency={book.currency}
          onClose={(paid) => {
            setMmVisible(false);
            if (paid) {
              Alert.alert(
                tr({ fr: "Merci !", en: "Thanks!" }),
                tr({
                  fr: "Ton paiement est en cours de vérification. Le livre s'ouvrira dès validation (sous 24h).",
                  en: "Your payment is being verified. The book will unlock once validated (within 24h).",
                })
              );
            }
          }}
          submitPayment={({ provider, senderPhone, reference }) =>
            createBookMobileMoneyPurchase({
              bookId: String(id),
              amountCents: book.priceCents,
              currency: book.currency,
              provider,
              senderPhone,
              reference,
            })
          }
        />
    </SafeAreaView>
  );
}
