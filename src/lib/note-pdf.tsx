// Génération PDF d'une note (évaluation) pour les parents — en-tête école.

import React from "react";
import { Document, Page, Text, View, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer";

export type NotePdfData = {
  school: { name: string; city?: string | null; logoUrl?: string | null; brandColor?: string | null };
  studentName: string;
  className: string;
  subject: string;
  kind: string;
  score: number;
  max: number;
  coefficient: number;
  date: string; // déjà formaté
};

const s = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 12, color: "#1A1410" },
  brandBar: { height: 6, marginBottom: 16, borderRadius: 2 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  logo: { width: 46, height: 46, marginRight: 12, objectFit: "contain" },
  schoolName: { fontSize: 15, fontWeight: 700 },
  schoolCity: { fontSize: 10, color: "#8A7C6E", marginTop: 2 },
  kicker: { fontSize: 10, color: "#8A7C6E", letterSpacing: 1, textTransform: "uppercase", marginTop: 14 },
  title: { fontSize: 18, fontWeight: 700, marginTop: 4 },
  studentBox: { backgroundColor: "#FDF3E7", borderRadius: 6, padding: 12, marginTop: 14, marginBottom: 16 },
  studentName: { fontSize: 15, fontWeight: 700 },
  studentMeta: { fontSize: 11, color: "#4A3F35", marginTop: 2 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "#ECE3D2" },
  label: { fontSize: 11, color: "#8A7C6E" },
  value: { fontSize: 12, fontWeight: 700 },
  scoreBox: { marginTop: 18, alignItems: "center", padding: 16, borderWidth: 1, borderColor: "#ECE3D2", borderRadius: 8 },
  scoreLabel: { fontSize: 10, color: "#8A7C6E", textTransform: "uppercase", letterSpacing: 1 },
  score: { fontSize: 30, fontWeight: 700, marginTop: 4 },
  footer: { marginTop: 36, fontSize: 8, color: "#B5A99A", textAlign: "center" },
});

function Doc({ data }: { data: NotePdfData }) {
  const pct = data.max > 0 ? (data.score / data.max) * 100 : 0;
  const color = pct >= 50 ? "#1D6650" : "#C03A2B";
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={[s.brandBar, { backgroundColor: data.school.brandColor || "#E0701E" }]} />
        <View style={s.header}>
          {data.school.logoUrl ? <Image src={data.school.logoUrl} style={s.logo} /> : null}
          <View>
            <Text style={s.schoolName}>{data.school.name}</Text>
            {data.school.city ? <Text style={s.schoolCity}>{data.school.city}</Text> : null}
          </View>
        </View>

        <Text style={s.kicker}>Relevé de note</Text>
        <Text style={s.title}>{data.subject}</Text>

        <View style={s.studentBox}>
          <Text style={s.studentName}>{data.studentName}</Text>
          <Text style={s.studentMeta}>Classe : {data.className}</Text>
        </View>

        <View style={s.row}><Text style={s.label}>Évaluation</Text><Text style={s.value}>{data.kind}</Text></View>
        <View style={s.row}><Text style={s.label}>Date</Text><Text style={s.value}>{data.date}</Text></View>
        <View style={s.row}><Text style={s.label}>Coefficient</Text><Text style={s.value}>{data.coefficient}</Text></View>

        <View style={s.scoreBox}>
          <Text style={s.scoreLabel}>Note obtenue</Text>
          <Text style={[s.score, { color }]}>{data.score} / {data.max}</Text>
        </View>

        <Text style={s.footer}>Document généré via E-KLASS · {data.date}</Text>
      </Page>
    </Document>
  );
}

export async function renderNotePdf(data: NotePdfData): Promise<Buffer> {
  return renderToBuffer(<Doc data={data} />);
}
