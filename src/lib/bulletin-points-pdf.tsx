// Génération PDF du bulletin (format points : Branche / Max / Obtenu + résumé),
// en-tête nom + logo de l'école. Utilisé quand l'école envoie le bulletin encodé.

import React from "react";
import { Document, Page, Text, View, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer";

export type BulletinPointsRow = { branche: string; max: string; obtenu: string };
export type BulletinPointsData = {
  school: { name: string; city?: string | null; logoUrl?: string | null; brandColor?: string | null; signatureUrl?: string | null; directorName?: string | null };
  student: { fullName: string; className: string };
  period: string;
  rows: BulletinPointsRow[];
  place: string;
  mention: string;
  // Total des points et pourcentage saisis par le prof (prioritaires).
  // Vides => calcul automatique (Σ obtenu / Σ max).
  totalObtenu?: string;
  totalMax?: string;
  percentage?: string;
};

function num(v: string): number {
  const n = parseFloat((v || "").replace(",", "."));
  return isNaN(n) ? 0 : n;
}

const s = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 11, color: "#1A1410" },
  brandBar: { height: 6, marginBottom: 16, borderRadius: 2 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  logo: { width: 46, height: 46, marginRight: 12, objectFit: "contain" },
  schoolName: { fontSize: 15, fontWeight: 700 },
  schoolCity: { fontSize: 10, color: "#8A7C6E", marginTop: 2 },
  title: { fontSize: 11, color: "#8A7C6E", textTransform: "uppercase", letterSpacing: 1, marginLeft: "auto" },
  studentBox: { backgroundColor: "#FDF3E7", borderRadius: 6, padding: 12, marginBottom: 16 },
  studentName: { fontSize: 16, fontWeight: 700 },
  studentMeta: { fontSize: 11, color: "#4A3F35", marginTop: 2 },
  thead: { flexDirection: "row", borderBottomWidth: 2, borderBottomColor: "#1A1410", paddingBottom: 6, marginBottom: 4 },
  thBranche: { flex: 1, fontSize: 11, fontWeight: 700 },
  thNum: { width: 80, fontSize: 11, fontWeight: 700, textAlign: "right" },
  row: { flexDirection: "row", paddingVertical: 5 },
  cBranche: { flex: 1, fontSize: 11 },
  cNum: { width: 80, fontSize: 11, textAlign: "right" },
  cObt: { width: 80, fontSize: 11, textAlign: "right", fontWeight: 700 },
  summary: { marginTop: 18, borderTopWidth: 2, borderTopColor: "#1A1410", paddingTop: 10 },
  sRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  sLabel: { fontSize: 11, fontWeight: 700 },
  sValue: { fontSize: 11, fontWeight: 700 },
  signWrap: { marginTop: 26, flexDirection: "row", justifyContent: "space-between" },
  signCol: { width: "45%" },
  signLabel: { fontSize: 9, color: "#8A7C6E", textTransform: "uppercase", marginBottom: 6 },
  signImg: { height: 40, objectFit: "contain", marginBottom: 4 },
  signLine: { borderTopWidth: 1, borderTopColor: "#1A1410", paddingTop: 3, fontSize: 10, fontWeight: 700 },
  footer: { marginTop: 30, fontSize: 8, color: "#B5A99A", textAlign: "center" },
});

function Doc({ data }: { data: BulletinPointsData }) {
  const rows = data.rows.filter((r) => r.branche || r.max || r.obtenu);
  const autoMax = rows.reduce((a, r) => a + num(r.max), 0);
  const autoObtenu = rows.reduce((a, r) => a + num(r.obtenu), 0);
  const autoPct = autoMax > 0 ? +((autoObtenu / autoMax) * 100).toFixed(2) : 0;
  // Valeurs saisies par le prof si présentes, sinon calcul automatique.
  const totalObtenu = data.totalObtenu?.trim() ? data.totalObtenu : String(autoObtenu);
  const totalMax = data.totalMax?.trim() ? data.totalMax : String(autoMax);
  const pct = data.percentage?.trim() ? data.percentage : String(autoPct);

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
          <Text style={s.title}>Bulletin · {data.period}</Text>
        </View>

        <View style={s.studentBox}>
          <Text style={s.studentName}>{data.student.fullName}</Text>
          <Text style={s.studentMeta}>Classe : {data.student.className}</Text>
        </View>

        <View style={s.thead}>
          <Text style={s.thBranche}>Branche</Text>
          <Text style={s.thNum}>Max</Text>
          <Text style={s.thNum}>Obtenu</Text>
        </View>
        {rows.map((r, i) => (
          <View key={i} style={s.row}>
            <Text style={s.cBranche}>{r.branche}</Text>
            <Text style={s.cNum}>{r.max}</Text>
            <Text style={s.cObt}>{r.obtenu}</Text>
          </View>
        ))}

        <View style={s.summary}>
          <View style={s.sRow}><Text style={s.sLabel}>Total des points</Text><Text style={s.sValue}>{totalObtenu} / {totalMax}</Text></View>
          <View style={s.sRow}><Text style={s.sLabel}>Pourcentage</Text><Text style={s.sValue}>{pct}%</Text></View>
          <View style={s.sRow}><Text style={s.sLabel}>Place</Text><Text style={s.sValue}>{data.place || "—"}</Text></View>
          <View style={s.sRow}><Text style={s.sLabel}>Mention</Text><Text style={s.sValue}>{data.mention || "—"}</Text></View>
        </View>

        <View style={s.signWrap}>
          <View style={s.signCol}>
            <Text style={s.signLabel}>Signature du préfet / directeur</Text>
            {data.school.signatureUrl ? <Image src={data.school.signatureUrl} style={s.signImg} /> : <View style={{ height: 26 }} />}
            <Text style={s.signLine}>{data.school.directorName || "Signature"}</Text>
          </View>
          <View style={s.signCol}>
            <Text style={s.signLabel}>Parent / Tuteur</Text>
            <View style={{ height: 26 }} />
            <Text style={[s.signLine, { color: "#8A7C6E", fontWeight: 400 }]}>Signature</Text>
          </View>
        </View>

        <Text style={s.footer}>Bulletin généré via E-KLASS · {data.period}</Text>
      </Page>
    </Document>
  );
}

export async function renderBulletinPointsPdf(data: BulletinPointsData): Promise<Buffer> {
  return renderToBuffer(<Doc data={data} />);
}
