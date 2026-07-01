// Paiements — frais scolaires payés de l'enfant (total + historique).

import { View, Text, ScrollView, Pressable, ActivityIndicator, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useMemo, useState } from "react";

import { ScreenHeader } from "@/components/ScreenHeader";
import { Card } from "@/components/Card";
import { Icon } from "@/components/Icon";
import { useTheme, fonts } from "@/lib/theme";
import { T, useT } from "@/lib/i18n";
import { useChildren } from "@/lib/children";
import { listChildFees, type FeePayment } from "@/lib/db";

function fmtMoney(amount: number, currency: string): string {
  const cur = currency === "CDF" ? "FC" : currency === "USD" ? "$" : currency;
  const n = amount.toLocaleString("fr-FR");
  return currency === "USD" ? `${cur}${n}` : `${n} ${cur}`;
}

function fmtDate(d: string): string {
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export default function Paiements() {
  const t = useTheme();
  const tr = useT();
  const { selectedChild } = useChildren();
  const [fees, setFees] = useState<FeePayment[] | null>(null);

  useEffect(() => {
    if (!selectedChild) {
      setFees([]);
      return;
    }
    setFees(null);
    listChildFees(selectedChild.id).then(setFees).catch(() => setFees([]));
  }, [selectedChild?.id]);

  // Totaux par devise.
  const totals = useMemo(() => {
    const m = new Map<string, number>();
    for (const f of fees ?? []) m.set(f.currency, (m.get(f.currency) ?? 0) + f.amount);
    return [...m.entries()];
  }, [fees]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={["top", "bottom"]}>
      <ScreenHeader title={tr({ fr: "Paiements", en: "Payments" })} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
        {selectedChild && (
          <Text style={{ fontSize: 13, color: t.ink3, fontFamily: fonts.body }}>
            {selectedChild.name} · {[selectedChild.grade, selectedChild.option].filter(Boolean).join(" · ")}
          </Text>
        )}

        {fees === null ? (
          <ActivityIndicator color={t.brand} style={{ marginTop: 30 }} />
        ) : (
          <>
            {/* Total payé */}
            <Card style={{ padding: 18, backgroundColor: t.brand }}>
              <Text style={{ fontSize: 12, color: "white", opacity: 0.85, fontWeight: "600", letterSpacing: 0.4, textTransform: "uppercase", fontFamily: fonts.body }}>
                <T fr="Total payé" en="Total paid" />
              </Text>
              {totals.length === 0 ? (
                <Text style={{ fontSize: 28, color: "white", fontWeight: "700", fontFamily: fonts.display, marginTop: 4 }}>—</Text>
              ) : (
                <View style={{ marginTop: 4, gap: 2 }}>
                  {totals.map(([cur, amt]) => (
                    <Text key={cur} style={{ fontSize: 28, color: "white", fontWeight: "700", fontFamily: fonts.display, letterSpacing: -0.5 }}>
                      {fmtMoney(amt, cur)}
                    </Text>
                  ))}
                </View>
              )}
              <Text style={{ fontSize: 11.5, color: "white", opacity: 0.85, marginTop: 6, fontFamily: fonts.body }}>
                <T fr={`${(fees ?? []).length} paiement(s) enregistré(s)`} en={`${(fees ?? []).length} payment(s) recorded`} />
              </Text>
            </Card>

            {/* Historique */}
            <Text style={{ fontSize: 15, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold, marginTop: 2 }}>
              <T fr="Historique des paiements" en="Payment history" />
            </Text>

            {(fees ?? []).length === 0 ? (
              <Card style={{ padding: 24, alignItems: "center", gap: 8 }}>
                <Icon name="creditcard" size={30} color={t.ink3} />
                <Text style={{ fontSize: 13, color: t.ink3, textAlign: "center", fontFamily: fonts.body }}>
                  <T fr="Aucun paiement enregistré pour l'instant." en="No payment recorded yet." />
                </Text>
              </Card>
            ) : (
              <View style={{ gap: 10 }}>
                {(fees ?? []).map((f) => (
                  <Card key={f.id} style={{ padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: t.accent + "1F", alignItems: "center", justifyContent: "center" }}>
                      <Icon name="check" size={20} color={t.accent} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold }}>
                        {f.label || tr({ fr: "Paiement", en: "Payment" })}
                      </Text>
                      <Text style={{ fontSize: 12, color: t.ink3, marginTop: 1, fontFamily: fonts.body }}>{fmtDate(f.paidAt)}</Text>
                      {f.receiptUrl && (
                        <Pressable onPress={() => Linking.openURL(f.receiptUrl!).catch(() => {})} hitSlop={6} style={{ marginTop: 4 }}>
                          <Text style={{ fontSize: 12, color: t.brand600, fontWeight: "600", fontFamily: fonts.bodyBold }}>
                            <T fr="Voir le reçu" en="View receipt" />
                          </Text>
                        </Pressable>
                      )}
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: t.ink, fontFamily: fonts.display }}>
                      {fmtMoney(f.amount, f.currency)}
                    </Text>
                  </Card>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
