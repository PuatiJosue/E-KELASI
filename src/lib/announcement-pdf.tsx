// Génération PDF d'une annonce d'école (en-tête nom + logo de l'école).

import React from "react";
import { Document, Page, Text, View, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer";

export type AnnouncementPdfData = {
  school: { name: string; city?: string | null; logoUrl?: string | null; brandColor?: string | null };
  title: string;
  body: string;
  eventDate?: string | null;
  issuedAt: string; // déjà formaté
};

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 12, color: "#1A1410" },
  brandBar: { height: 6, marginBottom: 18, borderRadius: 2 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  logo: { width: 46, height: 46, marginRight: 12, objectFit: "contain" },
  schoolName: { fontSize: 15, fontWeight: 700 },
  schoolCity: { fontSize: 10, color: "#8A7C6E", marginTop: 2 },
  kicker: { fontSize: 10, color: "#8A7C6E", letterSpacing: 1, textTransform: "uppercase", marginTop: 18 },
  title: { fontSize: 20, fontWeight: 700, marginTop: 4 },
  meta: { fontSize: 10, color: "#8A7C6E", marginTop: 4 },
  body: { fontSize: 12, lineHeight: 1.6, marginTop: 18, color: "#2A2118" },
  footer: { marginTop: 40, fontSize: 8, color: "#B5A99A", textAlign: "center" },
});

function AnnouncementDoc({ data }: { data: AnnouncementPdfData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={[styles.brandBar, { backgroundColor: data.school.brandColor || "#E0701E" }]} />
        <View style={styles.header}>
          {data.school.logoUrl ? <Image src={data.school.logoUrl} style={styles.logo} /> : null}
          <View>
            <Text style={styles.schoolName}>{data.school.name}</Text>
            {data.school.city ? <Text style={styles.schoolCity}>{data.school.city}</Text> : null}
          </View>
        </View>

        <Text style={styles.kicker}>Annonce officielle</Text>
        <Text style={styles.title}>{data.title}</Text>
        <Text style={styles.meta}>
          {data.eventDate ? `Date de l'évènement : ${data.eventDate}  ·  ` : ""}Publié le {data.issuedAt}
        </Text>

        <Text style={styles.body}>{data.body}</Text>

        <Text style={styles.footer}>Document généré via E-KLASS · {data.issuedAt}</Text>
      </Page>
    </Document>
  );
}

export async function renderAnnouncementPdf(data: AnnouncementPdfData): Promise<Buffer> {
  return renderToBuffer(<AnnouncementDoc data={data} />);
}
