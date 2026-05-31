// Génération de bulletins PDF côté serveur.
//
// Le bulletin reprend la logique de la page /school/reports/[student] :
// toutes les notes de l'année scolaire en cours, groupées par matière,
// avec moyenne par matière + moyenne générale.

import React from "react";
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";

// ── Types ───────────────────────────────────────────────────────────
export type ReportGrade = {
  date: string;        // "12 mars"
  kind: string;        // "Contrôle · Géométrie"
  score: number;
  max: number;
  coefficient: number;
};

export type ReportSubject = {
  name: string;
  grades: ReportGrade[];
  average20: number | null;  // /20 normalisé, pondéré par coefficient
};

export type ReportData = {
  school: { name: string; city: string; brandColor?: string | null };
  student: { fullName: string; className: string };
  teacherName: string;
  asOf: string;
  subjects: ReportSubject[];
  overallAverage20: number | null;
};

// ── Styles ──────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 11, color: "#1A1410" },
  brandBar: { height: 6, marginBottom: 18, borderRadius: 2 },
  schoolBlock: { marginBottom: 16 },
  schoolName: { fontSize: 14, fontWeight: 700 },
  schoolCity: { fontSize: 10, color: "#8A7C6E", marginTop: 2 },
  title: { fontSize: 18, fontWeight: 700, marginTop: 14 },
  meta: { fontSize: 10, color: "#4A3F35", marginTop: 4 },
  subject: { marginTop: 16 },
  subjectHeader: {
    fontSize: 12, fontWeight: 700, marginBottom: 6,
    borderBottomWidth: 1, borderBottomColor: "#ECE3D2", paddingBottom: 4,
  },
  row: { flexDirection: "row", marginTop: 4 },
  cellDate:  { width: 70, fontSize: 9.5, color: "#8A7C6E" },
  cellKind:  { flex: 1, fontSize: 10 },
  cellScore: { width: 60, textAlign: "right", fontSize: 10, fontWeight: 700 },
  cellCoef:  { width: 40, textAlign: "right", fontSize: 9.5, color: "#8A7C6E" },
  subjectAvg: {
    marginTop: 6, fontSize: 10, fontWeight: 700, textAlign: "right",
    color: "#1A1410",
  },
  emptySubject: { fontSize: 9.5, color: "#8A7C6E", fontStyle: "italic", marginTop: 4 },
  overall: {
    marginTop: 28, padding: 14, backgroundColor: "#FDF3E7", borderRadius: 6,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  overallLabel: { fontSize: 11, fontWeight: 700, color: "#8F4310" },
  overallValue: { fontSize: 18, fontWeight: 700, color: "#8F4310" },
  footer: { marginTop: 36, fontSize: 8, color: "#B5A99A", textAlign: "center" },
});

// ── Document ─────────────────────────────────────────────────────────
function GradeReportDoc({ data }: { data: ReportData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={[styles.brandBar, { backgroundColor: data.school.brandColor || "#E0701E" }]} />
        <View style={styles.schoolBlock}>
          <Text style={styles.schoolName}>{data.school.name}</Text>
          {data.school.city ? <Text style={styles.schoolCity}>{data.school.city}</Text> : null}
        </View>

        <Text style={styles.title}>Bulletin · {data.student.fullName}</Text>
        <Text style={styles.meta}>
          Classe : {data.student.className}  ·  Édité le {data.asOf}  ·  Prof : {data.teacherName}
        </Text>

        {data.subjects.length === 0 ? (
          <Text style={styles.emptySubject}>Aucune note enregistrée pour cette année scolaire.</Text>
        ) : (
          data.subjects.map((s, i) => (
            <View key={i} style={styles.subject}>
              <Text style={styles.subjectHeader}>{s.name}</Text>
              {s.grades.length === 0 ? (
                <Text style={styles.emptySubject}>Aucune note dans cette matière.</Text>
              ) : (
                s.grades.map((g, j) => (
                  <View key={j} style={styles.row}>
                    <Text style={styles.cellDate}>{g.date}</Text>
                    <Text style={styles.cellKind}>{g.kind}</Text>
                    <Text style={styles.cellScore}>{g.score}/{g.max}</Text>
                    <Text style={styles.cellCoef}>×{g.coefficient}</Text>
                  </View>
                ))
              )}
              {s.average20 !== null && (
                <Text style={styles.subjectAvg}>Moyenne matière : {s.average20.toFixed(2)}/20</Text>
              )}
            </View>
          ))
        )}

        <View style={styles.overall}>
          <Text style={styles.overallLabel}>Moyenne générale</Text>
          <Text style={styles.overallValue}>
            {data.overallAverage20 !== null ? `${data.overallAverage20.toFixed(2)}/20` : "—"}
          </Text>
        </View>

        <Text style={styles.footer}>Bulletin généré via E-KELASI · {data.asOf}</Text>
      </Page>
    </Document>
  );
}

// ── Helpers calcul ───────────────────────────────────────────────────
export function schoolYearStartIso(now = new Date()): string {
  // Année scolaire = 1er septembre. Si on est en juillet/août, on prend
  // le 1er septembre de l'année précédente.
  const y = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  return new Date(Date.UTC(y, 8, 1)).toISOString(); // mois 8 = septembre (0-indexed)
}

export function computeSubjectAverage20(
  grades: Array<{ score: number; max: number; coefficient: number }>
): number | null {
  if (grades.length === 0) return null;
  let weightedSum = 0;
  let coefSum = 0;
  for (const g of grades) {
    if (!g.max || g.max <= 0) continue;
    weightedSum += (g.score / g.max) * 20 * (g.coefficient || 1);
    coefSum += g.coefficient || 1;
  }
  return coefSum > 0 ? weightedSum / coefSum : null;
}

export function computeOverallAverage20(subjectAvgs: Array<number | null>): number | null {
  const vals = subjectAvgs.filter((v): v is number => v !== null);
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export function formatDateFr(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

// ── Génération ───────────────────────────────────────────────────────
export async function renderGradeReportPdf(data: ReportData): Promise<Buffer> {
  return renderToBuffer(<GradeReportDoc data={data} />);
}
