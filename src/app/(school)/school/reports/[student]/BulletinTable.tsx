"use client";

import { useState } from "react";

type Row = { branche: string; max: string; obtenu: string };

function mentionFor(pct: number): string {
  if (pct >= 90) return "Excellent";
  if (pct >= 80) return "Très bien";
  if (pct >= 70) return "Bien";
  if (pct >= 60) return "Assez bien";
  if (pct >= 50) return "Satisfaisant";
  return "À améliorer";
}

// Bulletin éditable : tableau Branche / Max / Obtenu (3 colonnes, sans lignes
// séparatrices), laissé ouvert pour que l'école ajoute des lignes. En bas :
// total des points, pourcentage, place, mention, signature.
export function BulletinTable({
  initialRows,
  signatureUrl,
  directorName,
}: {
  initialRows: Row[];
  signatureUrl: string | null;
  directorName: string | null;
}) {
  const blank: Row = { branche: "", max: "", obtenu: "" };
  const [rows, setRows] = useState<Row[]>(
    initialRows.length > 0 ? initialRows : [blank, { ...blank }, { ...blank }]
  );
  const [place, setPlace] = useState("");
  const [mention, setMention] = useState("");

  const num = (v: string) => {
    const n = parseFloat((v || "").replace(",", "."));
    return isNaN(n) ? 0 : n;
  };
  const totalMax = rows.reduce((a, r) => a + num(r.max), 0);
  const totalObtenu = rows.reduce((a, r) => a + num(r.obtenu), 0);
  const pct = totalMax > 0 ? +((totalObtenu / totalMax) * 100).toFixed(2) : 0;

  const setRow = (i: number, key: keyof Row, value: string) =>
    setRows((prev) => prev.map((r, j) => (j === i ? { ...r, [key]: value } : r)));
  const addRow = () => setRows((prev) => [...prev, { ...blank }]);
  const removeRow = (i: number) => setRows((prev) => prev.filter((_, j) => j !== i));

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Tableau 3 colonnes : Branche · Max · Obtenu */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #1a1410" }}>
            <th style={thLeft}>Branche</th>
            <th style={thRight}>Max</th>
            <th style={thRight}>Obtenu</th>
            <th style={{ width: 28 }} className="report-toolbar"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td style={tdCell}>
                <input value={r.branche} onChange={(e) => setRow(i, "branche", e.target.value)} placeholder="Cours…" style={cellInput} />
              </td>
              <td style={tdCell}>
                <input value={r.max} onChange={(e) => setRow(i, "max", e.target.value)} inputMode="decimal" placeholder="—" style={{ ...cellInput, textAlign: "right" }} />
              </td>
              <td style={tdCell}>
                <input value={r.obtenu} onChange={(e) => setRow(i, "obtenu", e.target.value)} inputMode="decimal" placeholder="—" style={{ ...cellInput, textAlign: "right", fontWeight: 700 }} />
              </td>
              <td className="report-toolbar" style={{ textAlign: "center" }}>
                <button onClick={() => removeRow(i)} title="Supprimer la ligne" style={{ color: "#C03A2B", background: "none", border: "none", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>
                  ×
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={addRow} className="report-toolbar" style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: "#E0701E", background: "none", border: "1px dashed #E0701E", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>
        + Ajouter une ligne
      </button>

      {/* Résumé bas de bulletin */}
      <div style={{ marginTop: 24, borderTop: "2px solid #1a1410", paddingTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        <SummaryRow label="Total des points">
          <span style={{ fontWeight: 700 }}>{totalObtenu}</span>
          <span style={{ color: "#8a7c6e" }}> / {totalMax}</span>
        </SummaryRow>
        <SummaryRow label="Pourcentage">
          <span style={{ fontWeight: 700, color: pct >= 50 ? "#1D6650" : "#C03A2B" }}>{pct}%</span>
        </SummaryRow>
        <SummaryRow label="Place">
          <input value={place} onChange={(e) => setPlace(e.target.value)} placeholder="ex. 4e / 28" style={{ ...summaryInput }} />
        </SummaryRow>
        <SummaryRow label="Mention">
          <input value={mention} onChange={(e) => setMention(e.target.value)} placeholder={mentionFor(pct)} style={{ ...summaryInput }} />
        </SummaryRow>
      </div>

      {/* Signature numérique du préfet / directeur */}
      <div style={{ marginTop: 28, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30 }}>
        <div>
          <div style={{ fontSize: 11, color: "#8a7c6e", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
            Signature du préfet / directeur
          </div>
          {signatureUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={signatureUrl} alt="Signature" style={{ height: 48, objectFit: "contain", display: "block", marginBottom: 4 }} />
          ) : (
            <div style={{ height: 30 }} />
          )}
          <div style={{ borderBottom: "1px solid #1a1410", paddingBottom: 4, fontSize: 11.5, color: "#1a1410", fontWeight: 600 }}>
            {directorName || "Signature"}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "#8a7c6e", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 30 }}>
            Parent / Tuteur
          </div>
          <div style={{ borderBottom: "1px solid #1a1410", paddingBottom: 4, fontSize: 11, color: "#8a7c6e" }}>Signature</div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1410" }}>{label}</span>
      <span style={{ fontSize: 14, color: "#1a1410", textAlign: "right" }}>{children}</span>
    </div>
  );
}

const thLeft: React.CSSProperties = { padding: "8px 6px", fontSize: 12, fontWeight: 700, color: "#1a1410", textAlign: "left" };
const thRight: React.CSSProperties = { padding: "8px 6px", fontSize: 12, fontWeight: 700, color: "#1a1410", textAlign: "right", width: 90 };
const tdCell: React.CSSProperties = { padding: "2px 0", verticalAlign: "middle" };
const cellInput: React.CSSProperties = {
  width: "100%", padding: "6px 6px", border: "1px solid transparent", borderRadius: 6,
  background: "transparent", fontSize: 13, color: "#1a1410", fontFamily: "inherit", outlineColor: "#E0701E",
};
const summaryInput: React.CSSProperties = {
  border: "1px solid #ECE3D2", borderRadius: 6, padding: "5px 8px", fontSize: 13.5,
  fontWeight: 700, color: "#1a1410", textAlign: "right", background: "transparent", minWidth: 140, fontFamily: "inherit",
};
