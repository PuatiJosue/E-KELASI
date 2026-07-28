"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { RubriqueFraisTab } from "./frais/RubriqueFraisTab";
import type { ClassOption } from "./frais/types";
import { TresorerieTab } from "./tresorerie/TresorerieTab";
import { AlertsBell } from "./AlertsBell";
import { ReportsPanel } from "./ReportsPanel";
import type { SchoolBranding } from "./finance-ui";
import type { FeesOverview } from "@/lib/finance/fees";
import type { TreasuryOverview, CashState } from "@/lib/finance/treasury";
import type { FinanceAlert } from "@/lib/finance/alerts";

const TABS = [
  { key: "scolaires", label: "Frais scolaires", icon: "creditcard" },
  { key: "autres", label: "Autres frais", icon: "clipboard" },
  { key: "tresorerie", label: "Trésorerie", icon: "dollar" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export function FinanceModule({
  feesScolaire, feesAutre, treasury, cashState, alerts, year, school, classes, years,
}: {
  feesScolaire: FeesOverview;
  feesAutre: FeesOverview;
  treasury: TreasuryOverview;
  cashState: CashState;
  alerts: FinanceAlert[];
  year: string;
  school: SchoolBranding;
  classes: ClassOption[];
  years: string[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("scolaires");
  const [reports, setReports] = useState(false);

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
        <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
          <button onClick={() => router.push("/school/messages?compose=reminder")} className="ek-btn ek-btn-outline" style={{ height: 40, fontSize: 12.5 }}><Icon name="bell" size={15} /> Rappel de paiement</button>
          <button onClick={() => setReports(true)} className="ek-btn ek-btn-outline" style={{ height: 40, fontSize: 12.5 }}><Icon name="file" size={15} /> Rapports</button>
          <AlertsBell alerts={alerts} />
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <span style={{ fontSize: 9.5, color: "var(--ink-3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>Année scolaire</span>
            <select defaultValue={year} style={{ padding: "0 10px", height: 40, borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)", fontSize: 13, color: "var(--ink)" }}>
              {(years.length ? years : [year]).map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
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

      {tab === "scolaires" && <RubriqueFraisTab kind="scolaire" overview={feesScolaire} year={year} school={school} classes={classes} />}
      {tab === "autres" && <RubriqueFraisTab kind="autre" overview={feesAutre} year={year} school={school} classes={classes} />}
      {tab === "tresorerie" && <TresorerieTab overview={treasury} cashState={cashState} year={year} school={school} />}

      {reports && <ReportsPanel classes={classes} year={year} school={school} onClose={() => setReports(false)} />}
    </div>
  );
}
