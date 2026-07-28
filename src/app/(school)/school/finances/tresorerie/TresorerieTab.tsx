"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { Kpi, MoneyLines, Toolbar, SearchInput, COLORS, RecoveryBar, selStyle, iconBtn, type SchoolBranding } from "../finance-ui";
import { money } from "../finance-export";
import { EvolutionChart } from "./EvolutionChart";
import { EntryModal } from "./EntryModal";
import { CancelEntryModal } from "./CancelEntryModal";
import { CashClosure } from "./CashClosure";
import { exportTreasuryCsv, exportTreasuryPdf } from "./exports";
import { KIND_LABEL } from "./constants";
import type { TreasuryOverview, TreasuryEntry, TreasuryKind } from "@/lib/finance/treasury";
import type { CashState } from "@/lib/finance/cash-session";

export function TresorerieTab({ overview, cashState, year, school }: { overview: TreasuryOverview; cashState: CashState; year: string; school: SchoolBranding }) {
  const router = useRouter();
  const c = overview.currency;
  const k = overview.kpis;
  const curList = overview.currencies.length ? overview.currencies : [c];
  const bc = (cur: string) => overview.byCurrency[cur] ?? overview.kpis;
  const [query, setQuery] = useState("");
  const [kindF, setKindF] = useState("");
  const [form, setForm] = useState<null | { kind: TreasuryKind; entry?: TreasuryEntry }>(null);
  const [cancelEntry, setCancelEntry] = useState<TreasuryEntry | null>(null);

  const q = query.trim().toLowerCase();
  const entries = useMemo(() => overview.entries.filter((e) => {
    if (kindF && e.kind !== kindF) return false;
    if (q && !e.label.toLowerCase().includes(q) && !(e.category ?? "").toLowerCase().includes(q)) return false;
    return true;
  }), [overview.entries, kindF, q]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Cartes de stats — séparées par devise */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        <Kpi icon="download" tint={COLORS.collected} label="Total des recettes" value={<MoneyLines entries={curList.map((cc) => [cc, bc(cc).totalRecettes])} />} sub="Frais + exceptionnelles" />
        <Kpi icon="upload" tint={COLORS.remaining} label="Total des dépenses" value={<MoneyLines entries={curList.map((cc) => [cc, bc(cc).totalDepenses])} />} />
        <Kpi icon="dollar" tint={k.solde >= 0 ? COLORS.collected : COLORS.remaining} label="Solde de trésorerie" value={<MoneyLines entries={curList.map((cc) => [cc, bc(cc).solde])} />} sub="Recettes − Dépenses" />
        <Kpi icon="flag" tint={COLORS.remaining} label="Total des impayés" value={<MoneyLines entries={curList.map((cc) => [cc, bc(cc).impayes])} />} />
        <Kpi icon="pieChart" tint={COLORS.brand} label="Taux de recouvrement" value={<>{curList.map((cc) => <div key={cc}>{cc} {bc(cc).tauxRecouvrement.toFixed(0)} %</div>)}</>} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: 16, alignItems: "start" }} className="ek-fin-grid">
        {/* Détail des recettes (par devise) */}
        <div className="ek-card" style={{ padding: 16 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 12 }}>Détail des recettes</div>
          <RecetteLine label="Frais scolaires" value={<MoneyLines entries={curList.map((cc) => [cc, bc(cc).recettesScolaires])} />} color={COLORS.collected} />
          <RecetteLine label="Autres frais" value={<MoneyLines entries={curList.map((cc) => [cc, bc(cc).recettesAutres])} />} color={COLORS.accent} />
          <RecetteLine label="Recettes exceptionnelles" value={<MoneyLines entries={curList.map((cc) => [cc, bc(cc).recettesExceptionnelles])} />} color={COLORS.partial} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--divider)", fontSize: 13 }}>
            <span style={{ color: "var(--ink-2)", fontWeight: 600 }}>Total</span>
            <span style={{ color: "var(--ink)", fontWeight: 800 }}><MoneyLines entries={curList.map((cc) => [cc, bc(cc).totalRecettes])} /></span>
          </div>
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
            {curList.map((cc) => (
              <div key={cc} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, color: "var(--ink-3)", width: 34 }}>{cc}</span>
                <div style={{ flex: 1 }}><RecoveryBar pct={bc(cc).tauxRecouvrement} /></div>
              </div>
            ))}
          </div>
        </div>

        {/* Évolution (par devise) */}
        <div className="ek-card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          {curList.map((cc) => (
            <div key={cc}>
              <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 12 }}>Évolution 6 mois — {cc}</div>
              <EvolutionChart data={overview.evolutionByCurrency[cc] ?? overview.evolution} currency={cc} />
            </div>
          ))}
        </div>
      </div>

      {/* Clôture quotidienne de caisse */}
      <CashClosure state={cashState} school={school} />

      {/* Barre d’outils */}
      <Toolbar>
        <SearchInput value={query} onChange={setQuery} placeholder="Rechercher une opération…" />
        <select value={kindF} onChange={(e) => setKindF(e.target.value)} style={{ ...selStyle, height: 38 }}>
          <option value="">Toutes les opérations</option>
          <option value="recette_exceptionnelle">Recettes exceptionnelles</option>
          <option value="depense">Dépenses</option>
        </select>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={() => exportTreasuryPdf(entries, overview, school, year)} disabled={entries.length === 0} className="ek-btn ek-btn-outline" style={{ height: 38, fontSize: 12.5, opacity: entries.length === 0 ? 0.5 : 1 }}><Icon name="file" size={14} /> PDF</button>
          <button onClick={() => exportTreasuryCsv(entries, overview)} disabled={entries.length === 0} className="ek-btn ek-btn-outline" style={{ height: 38, fontSize: 12.5, opacity: entries.length === 0 ? 0.5 : 1 }}><Icon name="download" size={14} /> Excel</button>
          <button onClick={() => setForm({ kind: "recette_exceptionnelle" })} className="ek-btn ek-btn-outline" style={{ height: 38, fontSize: 12.5 }}><Icon name="plus" size={14} /> Recette</button>
          <button onClick={() => setForm({ kind: "depense" })} className="ek-btn ek-btn-primary" style={{ height: 38, fontSize: 12.5 }}><Icon name="plus" size={14} stroke={2.5} /> Dépense</button>
        </div>
      </Toolbar>

      {/* Journal */}
      <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--divider)", fontSize: 13.5, fontWeight: 700 }}>Journal de trésorerie ({entries.length})</div>
        <div className="ek-tablewrap">
          <div style={{ minWidth: 720 }}>
            <div style={{ display: "grid", gridTemplateColumns: TR_GRID, padding: "9px 16px", fontSize: 10.5, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.04em", background: "var(--surface-2)" }}>
              <div>Date</div><div>Type</div><div>Catégorie</div><div>Libellé</div><div style={{ textAlign: "right" }}>Montant</div><div style={{ textAlign: "center" }}>Actions</div>
            </div>
            {entries.length === 0 ? (
              <div style={{ padding: 26, textAlign: "center", color: "var(--ink-3)", fontSize: 12.5 }}>Aucune opération.</div>
            ) : entries.map((e, i) => {
              const cancelled = !!e.cancelledAt;
              const isRec = e.kind === "recette_exceptionnelle";
              return (
                <div key={e.id} style={{ display: "grid", gridTemplateColumns: TR_GRID, padding: "10px 16px", alignItems: "center", fontSize: 12, borderTop: i > 0 ? "1px solid var(--divider)" : "none", opacity: cancelled ? 0.5 : 1 }}>
                  <div style={{ color: "var(--ink-2)" }}>{new Date(e.entryDate).toLocaleDateString("fr-FR")}</div>
                  <div><span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 999, fontSize: 10.5, fontWeight: 700, background: isRec ? "rgba(22,163,74,0.12)" : "rgba(225,29,72,0.12)", color: isRec ? "#16A34A" : "#E11D48" }}>{isRec ? "Recette" : "Dépense"}</span></div>
                  <div style={{ color: "var(--ink-3)" }}>{e.category ?? "—"}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: "var(--ink)", fontWeight: 600, textDecoration: cancelled ? "line-through" : "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.label}</div>
                    {cancelled && <div style={{ fontSize: 10, color: COLORS.remaining }}>Annulée : {e.cancelReason}</div>}
                  </div>
                  <div style={{ textAlign: "right", fontWeight: 700, color: isRec ? COLORS.collected : COLORS.remaining }}>{isRec ? "+" : "−"}{money(e.amount, e.currency)}</div>
                  <div style={{ display: "flex", justifyContent: "center", gap: 2 }}>
                    {!cancelled && <>
                      <button onClick={() => setForm({ kind: e.kind, entry: e })} title="Modifier" style={iconBtn}><Icon name="edit" size={13} /></button>
                      <button onClick={() => setCancelEntry(e)} title="Annuler" style={iconBtn}><Icon name="close" size={14} /></button>
                    </>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {form && <EntryModal kind={form.kind} entry={form.entry} year={year} onClose={() => setForm(null)} onDone={() => { setForm(null); router.refresh(); }} />}
      {cancelEntry && <CancelEntryModal entry={cancelEntry} onClose={() => setCancelEntry(null)} onDone={() => { setCancelEntry(null); router.refresh(); }} />}

      <style>{`@media (max-width: 980px){ .ek-fin-grid{ grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}

const TR_GRID = "0.9fr 0.9fr 1fr 1.8fr 1fr 0.8fr";

function RecetteLine({ label, value, color }: { label: string; value: React.ReactNode; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, padding: "5px 0" }}>
      <span style={{ width: 9, height: 9, borderRadius: 3, background: color }} />
      <span style={{ color: "var(--ink-2)", flex: 1 }}>{label}</span>
      <span style={{ color: "var(--ink)", fontWeight: 700 }}>{value}</span>
    </div>
  );
}

