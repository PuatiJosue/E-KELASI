import { View, Text, ScrollView, ActivityIndicator, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";

import { ScreenHeader } from "@/components/ScreenHeader";
import { Card } from "@/components/Card";
import { Icon } from "@/components/Icon";
import { useTheme, fonts } from "@/lib/theme";
import { useT } from "@/lib/i18n";
import { listDocuments, type ParentDocument } from "@/lib/db";

function fmtDate(d: string): string {
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default function Documents() {
  const t = useTheme();
  const tr = useT();
  const [items, setItems] = useState<ParentDocument[] | null>(null);

  useEffect(() => {
    listDocuments().then(setItems).catch(() => setItems([]));
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={["top", "bottom"]}>
      <ScreenHeader title={tr({ fr: "Documents officiels", en: "Official documents" })} />
      {!items ? (
        <ActivityIndicator color={t.brand} style={{ marginTop: 40 }} />
      ) : items.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 }}>
          <Icon name="file" size={36} color={t.ink3} />
          <Text style={{ fontSize: 14, color: t.ink3, textAlign: "center", fontFamily: fonts.body, lineHeight: 20 }}>
            {tr({ fr: "Aucun document pour le moment. L'école publiera les bulletins signés ici.", en: "No document yet. The school will publish signed report cards here." })}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
          {items.map((d) => (
            <Card key={d.id} style={{ padding: 16, gap: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: t.brandSoft, alignItems: "center", justifyContent: "center" }}>
                  <Icon name="file" size={17} color={t.brand600} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: t.ink, fontFamily: fonts.bodyBold }}>{d.title}</Text>
                  <Text style={{ fontSize: 12, color: t.ink3, fontFamily: fonts.body }}>
                    {[d.studentName, d.period].filter(Boolean).join(" · ")}
                  </Text>
                </View>
                {d.data?.overallAvg != null && (
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontSize: 20, fontWeight: "700", color: t.brand600, fontFamily: fonts.display }}>{d.data.overallAvg}</Text>
                    <Text style={{ fontSize: 10, color: t.ink3, fontFamily: fonts.body }}>/20</Text>
                  </View>
                )}
              </View>

              {Array.isArray(d.data?.subjects) && d.data.subjects.length > 0 && (
                <View style={{ gap: 4, marginTop: 2 }}>
                  {d.data.subjects.map((s: any, i: number) => (
                    <View key={i} style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ fontSize: 12.5, color: t.ink2, fontFamily: fonts.body }}>{s.name}</Text>
                      <Text style={{ fontSize: 12.5, color: t.ink, fontWeight: "600", fontFamily: fonts.bodyBold }}>{Number(s.avg).toFixed(1)}/20</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6, paddingTop: 8, borderTopWidth: 1, borderTopColor: t.divider }}>
                {d.signatureUrl ? (
                  <Image source={{ uri: d.signatureUrl }} style={{ width: 70, height: 30, resizeMode: "contain" }} />
                ) : null}
                <View style={{ flex: 1 }}>
                  {d.signedBy ? (
                    <Text style={{ fontSize: 11.5, color: t.ink2, fontFamily: fonts.bodyBold }}>✍️ {d.signedBy}</Text>
                  ) : null}
                  <Text style={{ fontSize: 10.5, color: t.ink3, fontFamily: fonts.body }}>
                    {fmtDate(d.issuedAt)} · {tr({ fr: "code", en: "code" })} {d.verifyCode}
                  </Text>
                </View>
                <Icon name="check" size={16} color={t.accent} />
              </View>
            </Card>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
