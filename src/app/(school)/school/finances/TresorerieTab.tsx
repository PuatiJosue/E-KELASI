"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import {
  Kpi, MoneyLines, Modal, Labeled, ModalActions, Toolbar, SearchInput, COLORS, RecoveryBar,
  selStyle, modalInp, iconBtn, errBox, type SchoolBranding,
} from "./finance-ui";
import { money, escHtml, openPrint, downloadCsv, reportHead, REPORT_CSS } from "./finance-export";
import { addTreasuryEntry, updateTreasuryEntry, cancelTreasuryEntry, openCashSession, closeCashSession, reopenCashSession } from "./actions-v2";
import type { TreasuryOverview, TreasuryEntry, TreasuryKind, CashState, CashSession } from "@/lib/finance/treasury";

const KIND_LABEL: Record<TreasuryKind, string> = { depense: "Dépense", recette_exceptionnelle: "Recette exceptionnelle" };
const EXC_CATEGORIES = ["Don", "Subvention", "Location d’infrastructure", "Intérêts bancaires", "Autre"];

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

// ── Graphique d’évolution (recettes/dépenses en barres, solde en ligne) ─
function EvolutionChart({ data, currency }: { data: { label: string; recettes: number; depenses: number; solde: number }[]; currency: string }) {
  const W = 300, H = 130, pad = 4, base = H - 16;
  const maxBar = Math.max(1, ...data.map((d) => Math.max(d.recettes, d.depenses)));
  const soldes = data.map((d) => d.solde);
  const minS = Math.min(0, ...soldes), maxS = Math.max(1, ...soldes);
  const n = data.length || 1;
  const slot = (W - pad * 2) / n;
  const yBar = (v: number) => base - (v / maxBar) * (base - 8);
  const ySolde = (v: number) => 8 + (1 - (v - minS) / (maxS - minS || 1)) * (base - 8);
  const soldePts = data.map((d, i) => `${pad + slot * i + slot / 2},${ySolde(d.solde)}`).join(" ");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", gap: 12, fontSize: 11, flexWrap: "wrap" }}>
        <Lg color={COLORS.collected} label="Recettes" /><Lg color={COLORS.remaining} label="Dépenses" /><Lg color={COLORS.brand} label="Solde" />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label="Évolution de la trésorerie">
        <line x1={pad} y1={base} x2={W - pad} y2={base} stroke="var(--divider)" strokeWidth={1} />
        {data.map((d, i) => {
          const x = pad + slot * i;
          const bw = Math.min(14, slot / 3);
          return (
            <g key={i}>
              <rect x={x + slot / 2 - bw - 1} y={yBar(d.recettes)} width={bw} height={base - yBar(d.recettes)} rx={2} fill={COLORS.collected} />
              <rect x={x + slot / 2 + 1} y={yBar(d.depenses)} width={bw} height={base - yBar(d.depenses)} rx={2} fill={COLORS.remaining} />
              <text x={x + slot / 2} y={H - 3} textAnchor="middle" fontSize={8} fill="var(--ink-3)">{d.label}</text>
            </g>
          );
        })}
        <polyline points={soldePts} fill="none" stroke={COLORS.brand} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {data.map((d, i) => <circle key={i} cx={pad + slot * i + slot / 2} cy={ySolde(d.solde)} r={2.5} fill={COLORS.brand} />)}
      </svg>
      <div style={{ fontSize: 10.5, color: "var(--ink-3)", textAlign: "right" }}>Solde actuel : {money(data[data.length - 1]?.solde ?? 0, currency)}</div>
    </div>
  );
}
function Lg({ color, label }: { color: string; label: string }) {
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--ink-2)" }}><span style={{ width: 9, height: 9, borderRadius: 3, background: color }} /> {label}</span>;
}

// ── Modale création / modification d’une opération ───────────────────
function EntryModal({ kind, entry, year, onClose, onDone }: { kind: TreasuryKind; entry?: TreasuryEntry; year: string; onClose: () => void; onDone: () => void }) {
  const isRec = kind === "recette_exceptionnelle";
  const [pending, start] = useTransition();
  const [label, setLabel] = useState(entry?.label ?? "");
  const [category, setCategory] = useState(entry?.category ?? (isRec ? "Don" : ""));
  const [amount, setAmount] = useState(entry ? String(entry.amount) : "");
  const [currency, setCurrency] = useState(entry?.currency ?? "CDF");
  const [entryDate, setEntryDate] = useState(entry?.entryDate ?? new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState(entry?.note ?? "");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const amt = parseFloat(amount.replace(",", ".")) || 0;
    if (!(amt > 0)) { setError("Montant invalide."); return; }
    if (!label.trim()) { setError("Libellé requis."); return; }
    start(async () => {
      const r = entry
        ? await updateTreasuryEntry({ id: entry.id, amount: amt, currency, label, category, entryDate, note })
        : await addTreasuryEntry({ kind, amount: amt, currency, label, category, entryDate, schoolYear: year, note });
      if (r.ok) onDone(); else setError(r.message);
    });
  };

  const title = entry ? `Modifier — ${KIND_LABEL[kind]}` : (isRec ? "Nouvelle recette exceptionnelle" : "Nouvelle dépense");
  return (
    <Modal title={title} onClose={onClose}>
      <Labeled label="Libellé"><input value={label} onChange={(e) => setLabel(e.target.value)} placeholder={isRec ? "Don d’un partenaire…" : "Facture électricité…"} style={modalInp} /></Labeled>
      <Labeled label="Catégorie">
        {isRec ? (
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={modalInp}>
            {EXC_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        ) : (
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Fonctionnement, fournitures…" style={modalInp} />
        )}
      </Labeled>
      <div style={{ display: "flex", gap: 10 }}>
        <Labeled label="Montant" style={{ flex: 1 }}><input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))} inputMode="decimal" placeholder="50000" style={modalInp} /></Labeled>
        <Labeled label="Devise" style={{ width: 100 }}><select value={currency} onChange={(e) => setCurrency(e.target.value)} style={modalInp}><option value="CDF">CDF</option><option value="USD">USD</option></select></Labeled>
      </div>
      <Labeled label="Date"><input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} style={modalInp} /></Labeled>
      <Labeled label="Note (facultatif)"><input value={note} onChange={(e) => setNote(e.target.value)} style={modalInp} /></Labeled>
      {error && <div style={errBox}>{error}</div>}
      <ModalActions onClose={onClose} onSubmit={submit} pending={pending} />
    </Modal>
  );
}

function CancelEntryModal({ entry, onClose, onDone }: { entry: TreasuryEntry; onClose: () => void; onDone: () => void }) {
  const [pending, start] = useTransition();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const submit = () => {
    if (!reason.trim()) { setError("Motif requis."); return; }
    start(async () => { const r = await cancelTreasuryEntry(entry.id, reason); if (r.ok) onDone(); else setError(r.message); });
  };
  return (
    <Modal title="Annuler l’opération" onClose={onClose}>
      <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{entry.label} · {money(entry.amount, entry.currency)}. L’opération est conservée (annulation tracée) et retirée des totaux.</div>
      <Labeled label="Motif d’annulation"><input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Erreur de saisie…" style={modalInp} /></Labeled>
      {error && <div style={errBox}>{error}</div>}
      <ModalActions onClose={onClose} onSubmit={submit} pending={pending} submitLabel="Confirmer l’annulation" />
    </Modal>
  );
}

// ── Clôture quotidienne de caisse ────────────────────────────────────
function CashClosure({ state, school }: { state: CashState; school: SchoolBranding }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [viewSession, setViewSession] = useState<CashSession | null>(null);
  const today = state.today;

  const open = () => start(async () => { const r = await openCashSession(); if (!r.ok) alert(r.message); else router.refresh(); });
  const close = () => { if (!today) return; if (!confirm("Clôturer la caisse du jour ? Les totaux seront figés.")) return; start(async () => { const r = await closeCashSession(today.id); if (!r.ok) alert(r.message); else router.refresh(); }); };

  return (
    <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--divider)", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13.5, fontWeight: 700, flex: 1 }}>Caisse du jour — {new Date().toLocaleDateString("fr-FR")}</span>
        {!today && <button onClick={open} disabled={pending} className="ek-btn ek-btn-primary" style={{ height: 34, fontSize: 12.5 }}><Icon name="login" size={14} /> Ouvrir la caisse</button>}
        {today?.status === "open" && <>
          <span style={{ fontSize: 11.5, color: COLORS.collected, fontWeight: 700 }}>Ouverte</span>
          <button onClick={close} disabled={pending} className="ek-btn ek-btn-primary" style={{ height: 34, fontSize: 12.5 }}><Icon name="lock" size={14} /> Clôturer la caisse</button>
        </>}
        {today?.status === "closed" && <>
          <span style={{ fontSize: 11.5, color: "var(--ink-3)", fontWeight: 700 }}>Clôturée</span>
          <button onClick={() => setViewSession(today)} className="ek-btn ek-btn-outline" style={{ height: 34, fontSize: 12.5 }}><Icon name="file" size={14} /> Rapport</button>
        </>}
      </div>

      {state.recent.length > 0 && (
        <div>
          <div style={{ padding: "8px 16px", fontSize: 11, color: "var(--ink-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Clôtures récentes</div>
          {state.recent.map((s, i) => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 16px", borderTop: "1px solid var(--divider)", fontSize: 12.5 }}>
              <span style={{ flex: 1 }}>{new Date(s.sessionDate).toLocaleDateString("fr-FR")}{s.closedBy ? ` · ${s.closedBy}` : ""}</span>
              <span style={{ fontWeight: 700, textAlign: "right" }}>{s.totals && Object.keys(s.totals.byCurrency).length ? Object.entries(s.totals.byCurrency).map(([cur, tt]) => <div key={cur} style={{ color: tt.solde >= 0 ? COLORS.collected : COLORS.remaining }}>{money(tt.solde, cur)}</div>) : <span style={{ color: "var(--ink-3)" }}>—</span>}</span>
              <button onClick={() => setViewSession(s)} title="Rapport de clôture" style={iconBtn}><Icon name="file" size={14} /></button>
            </div>
          ))}
        </div>
      )}

      {viewSession && <ClosureModal session={viewSession} school={school} onClose={() => setViewSession(null)} onChanged={() => router.refresh()} />}
    </div>
  );
}

function ClosureModal({ session, school, onClose, onChanged }: { session: CashSession; school: SchoolBranding; onClose: () => void; onChanged: () => void }) {
  const [pending, start] = useTransition();
  const t = session.totals;
  const curList = t ? (t.currencies.length ? t.currencies : ["CDF"]) : [];
  const reopen = () => {
    const reason = prompt("Motif de la réouverture (tracé dans l’historique) :");
    if (!reason?.trim()) return;
    start(async () => { const r = await reopenCashSession(session.id, reason); if (!r.ok) alert(r.message); else { onChanged(); onClose(); } });
  };
  return (
    <Modal title={`Rapport de clôture — ${new Date(session.sessionDate).toLocaleDateString("fr-FR")}`} onClose={onClose} wide>
      <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
        Ouverte le {new Date(session.openedAt).toLocaleString("fr-FR")}{session.openedBy ? ` par ${session.openedBy}` : ""}
        {session.closedAt ? ` · Clôturée le ${new Date(session.closedAt).toLocaleString("fr-FR")}${session.closedBy ? ` par ${session.closedBy}` : ""}` : ""}
      </div>
      {t ? (
        <>
          {curList.map((cc) => { const tt = t.byCurrency[cc]; if (!tt) return null; return (
            <div key={cc}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--ink-2)", marginBottom: 6 }}>Devise {cc}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 1, background: "var(--border)", borderRadius: 10, overflow: "hidden" }}>
                <Cs label="Frais scolaires" value={money(tt.recettesScolaires, cc)} color={COLORS.collected} />
                <Cs label="Autres frais" value={money(tt.recettesAutres, cc)} color={COLORS.accent} />
                <Cs label="Exceptionnelles" value={money(tt.recettesExceptionnelles, cc)} color={COLORS.partial} />
                <Cs label="Total recettes" value={money(tt.totalRecettes, cc)} color="var(--ink)" />
                <Cs label="Total dépenses" value={money(tt.totalDepenses, cc)} color={COLORS.remaining} />
                <Cs label="Solde" value={money(tt.solde, cc)} color={tt.solde >= 0 ? COLORS.collected : COLORS.remaining} />
              </div>
            </div>
          ); })}
          {t.depenses.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Détail des dépenses</div>
              {t.depenses.map((d, i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0", borderBottom: "1px solid var(--divider)" }}><span>{d.label}{d.category ? ` · ${d.category}` : ""}</span><span style={{ color: COLORS.remaining }}>{money(d.amount, d.currency)}</span></div>)}
            </div>
          )}
          {t.recettes.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Recettes exceptionnelles</div>
              {t.recettes.map((d, i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0", borderBottom: "1px solid var(--divider)" }}><span>{d.label}{d.category ? ` · ${d.category}` : ""}</span><span style={{ color: COLORS.collected }}>{money(d.amount, d.currency)}</span></div>)}
            </div>
          )}
        </>
      ) : (
        <div style={{ color: "var(--ink-3)", fontSize: 12.5 }}>Caisse encore ouverte — clôturez-la pour figer les totaux.</div>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        {session.status === "closed" && <button onClick={reopen} disabled={pending} className="ek-btn ek-btn-outline" style={{ flex: 1 }}>Rouvrir (motivé)</button>}
        {t && <button onClick={() => exportClosurePdf(session, school)} className="ek-btn ek-btn-outline" style={{ flex: 1 }}><Icon name="file" size={14} /> PDF</button>}
        {t && <button onClick={() => exportClosureCsv(session)} className="ek-btn ek-btn-outline" style={{ flex: 1 }}><Icon name="download" size={14} /> Excel</button>}
        <button onClick={onClose} className="ek-btn ek-btn-primary" style={{ flex: 1 }}>Fermer</button>
      </div>
    </Modal>
  );
}
function Cs({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ padding: "10px 12px", background: "var(--surface)" }}>
      <div style={{ fontSize: 9.5, color: "var(--ink-3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 800, color, marginTop: 3, fontFamily: "var(--font-display)" }}>{value}</div>
    </div>
  );
}
function exportClosureCsv(s: CashSession) {
  const t = s.totals; if (!t) return;
  const curList = t.currencies.length ? t.currencies : ["CDF"];
  const lines: (string | number)[][] = [["Rapport de clôture de caisse", new Date(s.sessionDate).toLocaleDateString("fr-FR")], ["Clôturée le", s.closedAt ? new Date(s.closedAt).toLocaleString("fr-FR") : "", "par", s.closedBy ?? ""]];
  for (const cur of curList) {
    const tt = t.byCurrency[cur]; if (!tt) continue;
    lines.push([]);
    lines.push([`Synthèse ${cur}`]);
    lines.push(["Recettes frais scolaires", Math.round(tt.recettesScolaires)]);
    lines.push(["Recettes autres frais", Math.round(tt.recettesAutres)]);
    lines.push(["Recettes exceptionnelles", Math.round(tt.recettesExceptionnelles)]);
    lines.push(["Total recettes", Math.round(tt.totalRecettes)]);
    lines.push(["Total dépenses", Math.round(tt.totalDepenses)]);
    lines.push(["Solde", Math.round(tt.solde)]);
  }
  downloadCsv(lines, `cloture-caisse-${s.sessionDate}.csv`);
}
function exportClosurePdf(s: CashSession, school: SchoolBranding) {
  const t = s.totals; if (!t) return;
  const curList = t.currencies.length ? t.currencies : ["CDF"];
  const synth = curList.map((cur) => { const tt = t.byCurrency[cur]; if (!tt) return ""; return `<h2>Synthèse — ${escHtml(cur)}</h2><table><tbody><tr><td>Recettes frais scolaires</td><td class="r">${money(tt.recettesScolaires, cur)}</td></tr><tr><td>Recettes autres frais</td><td class="r">${money(tt.recettesAutres, cur)}</td></tr><tr><td>Recettes exceptionnelles</td><td class="r">${money(tt.recettesExceptionnelles, cur)}</td></tr><tr><td><strong>Total des recettes</strong></td><td class="r"><strong>${money(tt.totalRecettes, cur)}</strong></td></tr><tr><td><strong>Total des dépenses</strong></td><td class="r"><strong>${money(tt.totalDepenses, cur)}</strong></td></tr></tbody><tfoot><tr><td>Solde final</td><td class="r">${money(tt.solde, cur)}</td></tr></tfoot></table>`; }).join("");
  const depRows = t.depenses.map((d) => `<tr><td>${escHtml(d.label)}</td><td>${escHtml(d.category ?? "")}</td><td class="r" style="color:#E11D48">${money(d.amount, d.currency)}</td></tr>`).join("") || '<tr><td colspan="3">—</td></tr>';
  const recRows = t.recettes.map((d) => `<tr><td>${escHtml(d.label)}</td><td>${escHtml(d.category ?? "")}</td><td class="r" style="color:#16A34A">${money(d.amount, d.currency)}</td></tr>`).join("") || '<tr><td colspan="3">—</td></tr>';
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Clôture de caisse</title><style>${REPORT_CSS}</style></head><body>${reportHead(school)}<h1>Rapport de clôture de caisse</h1>
<div class="sub">Journée du ${escHtml(new Date(s.sessionDate).toLocaleDateString("fr-FR"))} · Clôturée le ${escHtml(s.closedAt ? new Date(s.closedAt).toLocaleString("fr-FR") : "—")}${s.closedBy ? ` par ${escHtml(s.closedBy)}` : ""}</div>
${synth}
<h2>Détail des dépenses</h2><table><thead><tr><th>Libellé</th><th>Catégorie</th><th class="r">Montant</th></tr></thead><tbody>${depRows}</tbody></table>
<h2>Recettes exceptionnelles</h2><table><thead><tr><th>Libellé</th><th>Catégorie</th><th class="r">Montant</th></tr></thead><tbody>${recRows}</tbody></table>
<div class="foot">E-KELASI · rapport de clôture</div><script>window.onload=function(){window.print()}</script></body></html>`;
  openPrint(html);
}

// ── Exports ──────────────────────────────────────────────────────────
function exportTreasuryCsv(entries: TreasuryEntry[], overview: TreasuryOverview) {
  const curList = overview.currencies.length ? overview.currencies : [overview.currency];
  const lines: (string | number)[][] = [["Journal de trésorerie"], [], ["Date", "Type", "Catégorie", "Libellé", "Montant", "Devise", "Statut"]];
  for (const e of entries) lines.push([e.entryDate, KIND_LABEL[e.kind], e.category ?? "", e.label, Math.round(e.amount), e.currency, e.cancelledAt ? `Annulée : ${e.cancelReason ?? ""}` : "Validée"]);
  for (const cur of curList) {
    const k = overview.byCurrency[cur] ?? overview.kpis;
    lines.push([]);
    lines.push([`Synthèse ${cur}`]);
    lines.push(["Recettes frais scolaires", Math.round(k.recettesScolaires)]);
    lines.push(["Recettes autres frais", Math.round(k.recettesAutres)]);
    lines.push(["Recettes exceptionnelles", Math.round(k.recettesExceptionnelles)]);
    lines.push(["Total recettes", Math.round(k.totalRecettes)]);
    lines.push(["Total dépenses", Math.round(k.totalDepenses)]);
    lines.push(["Solde", Math.round(k.solde)]);
  }
  downloadCsv(lines, "tresorerie.csv");
}

function exportTreasuryPdf(entries: TreasuryEntry[], overview: TreasuryOverview, school: SchoolBranding, year: string) {
  const curList = overview.currencies.length ? overview.currencies : [overview.currency];
  const kc = (cur: string) => overview.byCurrency[cur] ?? overview.kpis;
  const synth = curList.map((cur) => { const k = kc(cur); return `<h2>Synthèse — ${escHtml(cur)}</h2><table><tbody><tr><td>Recettes frais scolaires</td><td class="r">${money(k.recettesScolaires, cur)}</td></tr><tr><td>Recettes autres frais</td><td class="r">${money(k.recettesAutres, cur)}</td></tr><tr><td>Recettes exceptionnelles</td><td class="r">${money(k.recettesExceptionnelles, cur)}</td></tr><tr><td><strong>Total des recettes</strong></td><td class="r"><strong>${money(k.totalRecettes, cur)}</strong></td></tr><tr><td><strong>Total des dépenses</strong></td><td class="r"><strong>${money(k.totalDepenses, cur)}</strong></td></tr><tr><td>Total des impayés</td><td class="r">${money(k.impayes, cur)}</td></tr></tbody><tfoot><tr><td>Solde de trésorerie</td><td class="r">${money(k.solde, cur)}</td></tr></tfoot></table>`; }).join("");
  const body = entries.map((e) => {
    const isRec = e.kind === "recette_exceptionnelle";
    return `<tr${e.cancelledAt ? ' style="opacity:.5"' : ""}><td>${escHtml(new Date(e.entryDate).toLocaleDateString("fr-FR"))}</td><td>${isRec ? "Recette" : "Dépense"}</td><td>${escHtml(e.category ?? "")}</td><td>${escHtml(e.label)}</td><td class="r" style="color:${isRec ? "#16A34A" : "#E11D48"}">${isRec ? "+" : "−"}${money(e.amount, e.currency)}</td></tr>`;
  }).join("");
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Trésorerie</title><style>${REPORT_CSS}</style></head><body>${reportHead(school)}<h1>Trésorerie — ${escHtml(year)}</h1>
<table><thead><tr><th>Date</th><th>Type</th><th>Catégorie</th><th>Libellé</th><th class="r">Montant</th></tr></thead><tbody>${body}</tbody></table>
${synth}
<div class="foot">E-KELASI</div><script>window.onload=function(){window.print()}</script></body></html>`;
  openPrint(html);
}
