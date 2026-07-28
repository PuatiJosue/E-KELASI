"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { Kpi, MoneyLines, Toolbar, SearchInput, StackedBars, COLORS, selStyle, type SchoolBranding } from "../finance-ui";
import { FeeRow } from "./FeeRow";
import { FeeFormModal } from "./FeeFormModal";
import { FeeDetailModal } from "./FeeDetailModal";
import { exportFeesCsv, exportFeesPdf } from "./exports";
import type { FeesOverview, Fee, FeeKind } from "@/lib/finance/fees";
import type { ClassOption } from "./types";

export function RubriqueFraisTab({
  kind, overview, year, school, classes,
}: {
  kind: FeeKind;
  overview: FeesOverview;
  year: string;
  school: SchoolBranding;
  classes: ClassOption[];
}) {
  const router = useRouter();
  const isScol = kind === "scolaire";
  const rubTitle = isScol ? "Frais scolaires" : "Autres frais";
  const createLabel = "Ajouter une rubrique";
  const c = overview.currency;
  const [query, setQuery] = useState("");
  const [classF, setClassF] = useState("");
  const [feeModal, setFeeModal] = useState<null | "new" | Fee>(null);
  const [openFee, setOpenFee] = useState<Fee | null>(null);

  const q = query.trim().toLowerCase();
  const fees = useMemo(() => overview.fees.filter((f) => {
    if (classF && f.classDisplay !== classF) return false;
    if (q && !f.label.toLowerCase().includes(q) && !(f.classDisplay ?? "").toLowerCase().includes(q)) return false;
    return true;
  }), [overview.fees, classF, q]);

  // Agrégats séparés par devise (USD / CDF).
  const byCur = useMemo(() => {
    const m = new Map<string, { expected: number; collected: number; remaining: number }>();
    for (const f of fees) {
      const e = m.get(f.currency) ?? { expected: 0, collected: 0, remaining: 0 };
      e.expected += f.expected; e.collected += f.collected; e.remaining += f.remaining;
      m.set(f.currency, e);
    }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [fees]);

  const classList = [...new Set(overview.fees.map((f) => f.classDisplay).filter(Boolean))] as string[];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Cartes de stats — séparées par devise */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
        <Kpi icon="creditcard" tint={COLORS.accent} label="Montant attendu" value={<MoneyLines entries={byCur.map(([cc, v]) => [cc, v.expected])} />} sub={`${fees.length} frais`} />
        <Kpi icon="check" tint={COLORS.collected} label="Montant encaissé" value={<MoneyLines entries={byCur.map(([cc, v]) => [cc, v.collected])} />} sub="Envoyé en trésorerie" />
        <Kpi icon="flag" tint={COLORS.remaining} label="Impayés / restant" value={<MoneyLines entries={byCur.map(([cc, v]) => [cc, v.remaining])} />} />
        <Kpi icon="pieChart" tint={COLORS.brand} label="Taux de recouvrement" value={byCur.length ? <>{byCur.map(([cc, v]) => <div key={cc}>{cc} {(v.expected > 0 ? (v.collected / v.expected) * 100 : 0).toFixed(0)} %</div>)}</> : "—"} />
      </div>

      {/* Barre d’outils */}
      <Toolbar>
        <SearchInput value={query} onChange={setQuery} placeholder={isScol ? "Rechercher un frais ou une classe…" : "Rechercher une catégorie…"} />
        <label style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <span style={{ fontSize: 9.5, color: "var(--ink-3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>Classe</span>
          <select value={classF} onChange={(e) => setClassF(e.target.value)} style={{ ...selStyle, height: 38 }}>
            <option value="">Toutes</option>
            {classList.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={() => router.push("/school/messages?compose=reminder")} className="ek-btn ek-btn-outline" style={{ height: 38, fontSize: 12.5 }}><Icon name="bell" size={14} /> Rappel</button>
          <button onClick={() => exportFeesPdf(fees, c, school, year, rubTitle)} disabled={fees.length === 0} className="ek-btn ek-btn-outline" style={{ height: 38, fontSize: 12.5, opacity: fees.length === 0 ? 0.5 : 1 }}><Icon name="file" size={14} /> PDF</button>
          <button onClick={() => exportFeesCsv(fees, rubTitle)} disabled={fees.length === 0} className="ek-btn ek-btn-outline" style={{ height: 38, fontSize: 12.5, opacity: fees.length === 0 ? 0.5 : 1 }}><Icon name="download" size={14} /> Excel</button>
          <button onClick={() => setFeeModal("new")} className="ek-btn ek-btn-primary" style={{ height: 38, fontSize: 12.5 }}><Icon name="plus" size={14} stroke={2.5} /> {createLabel}</button>
        </div>
      </Toolbar>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: 16, alignItems: "start" }} className="ek-fin-grid">
        {/* Liste des frais */}
        <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--divider)", fontSize: 13.5, fontWeight: 700 }}>{rubTitle} ({fees.length})</div>
          {fees.length === 0 ? (
            <div style={{ padding: 30, textAlign: "center", color: "var(--ink-3)", fontSize: 12.5 }}>Aucun élément. Cliquez sur « {createLabel} ».</div>
          ) : fees.map((f, i) => (
            <FeeRow key={f.id} fee={f} first={i === 0} onOpen={() => setOpenFee(f)} onEdit={() => setFeeModal(f)} onChanged={() => router.refresh()} />
          ))}
        </div>

        {/* Graphique */}
        <div className="ek-card" style={{ padding: 16 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 12 }}>Attendu · Encaissé · Impayés</div>
          <StackedBars data={fees.map((f) => ({ label: f.label, collected: f.collected, remaining: f.remaining, currency: f.currency }))} currency={c} />
        </div>
      </div>

      {feeModal && (
        <FeeFormModal
          kind={kind}
          existing={feeModal === "new" ? null : feeModal}
          classes={classes} year={year}
          onClose={() => setFeeModal(null)}
          onDone={() => { setFeeModal(null); router.refresh(); }}
        />
      )}
      {openFee && (
        <FeeDetailModal fee={openFee} school={school} year={year} onClose={() => { setOpenFee(null); router.refresh(); }} />
      )}

      <style>{`@media (max-width: 980px){ .ek-fin-grid{ grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}

