"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { FraisScolairesTab, type ClassOption } from "./FraisScolairesTab";
import type { SchoolBranding } from "./finance-ui";
import type { FeesOverview } from "@/lib/finance/fees";

const TABS = [
  { key: "scolaires", label: "Frais scolaires", icon: "creditcard" },
  { key: "autres", label: "Autres frais", icon: "clipboard" },
  { key: "tresorerie", label: "Trésorerie", icon: "dollar" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export function FinanceModule({
  feesScolaire, year, school, classes, years,
}: {
  feesScolaire: FeesOverview;
  year: string;
  school: SchoolBranding;
  classes: ClassOption[];
  years: string[];
}) {
  const [tab, setTab] = useState<TabKey>("scolaires");

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      {/* En-tête */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)", fontFamily: "var(--font-display)" }}>Finance</h1>
          <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 2 }}>
            Frais scolaires, autres frais et trésorerie — synchronisés automatiquement.
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <span style={{ fontSize: 9.5, color: "var(--ink-3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>Année scolaire</span>
          <select defaultValue={year} style={{ padding: "0 10px", height: 40, borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)", fontSize: 13, color: "var(--ink)" }}>
            {(years.length ? years : [year]).map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Rubriques */}
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border)", overflowX: "auto" }}>
        {TABS.map((t) => {
          const on = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 16px", fontSize: 13.5, fontWeight: on ? 700 : 500, whiteSpace: "nowrap",
                color: on ? "var(--brand-600)" : "var(--ink-2)", background: "none", border: "none", cursor: "pointer",
                borderBottom: `2px solid ${on ? "var(--brand-600)" : "transparent"}`, marginBottom: -1 }}>
              <Icon name={t.icon} size={15} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "scolaires" && <FraisScolairesTab overview={feesScolaire} year={year} school={school} classes={classes} />}
      {tab === "autres" && <ComingSoon title="Autres frais" note="Catégories libres (uniforme, transport, cantine…), paiements et statistiques. Disponible en phase 2." />}
      {tab === "tresorerie" && <ComingSoon title="Trésorerie" note="Recettes (frais + exceptionnelles), dépenses, solde, graphiques d’évolution et clôture de caisse. Disponible en phase 2." />}
    </div>
  );
}

function ComingSoon({ title, note }: { title: string; note: string }) {
  return (
    <div className="ek-card" style={{ padding: 40, textAlign: "center", display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
      <span style={{ width: 44, height: 44, borderRadius: 12, background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-3)" }}>
        <Icon name="clock" size={22} />
      </span>
      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>{title}</div>
      <div style={{ fontSize: 12.5, color: "var(--ink-3)", maxWidth: 380 }}>{note}</div>
    </div>
  );
}
