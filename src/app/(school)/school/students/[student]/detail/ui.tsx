"use client";

// Petits blocs de présentation de la fiche élève.

import { T } from "@/lib/i18n";

export function SectionTitle({ fr, en }: { fr: string; en: string }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
      <T fr={fr} en={en} />
    </div>
  );
}

export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", fontSize: 13, borderTop: "1px solid var(--divider)" }}>
      <span style={{ color: "var(--ink-3)" }}>{label}</span>
      <span style={{ color: "var(--ink)", fontWeight: 600 }}>{value}</span>
    </div>
  );
}
