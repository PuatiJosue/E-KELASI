"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { Modal, Labeled, ModalActions, COLORS, modalInp, iconBtn, errBox, type SchoolBranding } from "../finance-ui";
import { money } from "../finance-export";
import { openCashSession, closeCashSession, reopenCashSession } from "../actions/cash-session";
import { exportClosureCsv, exportClosurePdf } from "./exports";
import type { CashState, CashSession } from "@/lib/finance/cash-session";

// ── Clôture quotidienne de caisse ────────────────────────────────────
export function CashClosure({ state, school }: { state: CashState; school: SchoolBranding }) {
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
              <span style={{ fontWeight: 700, textAlign: "right" }}>{s.totals?.byCurrency && Object.keys(s.totals.byCurrency).length ? Object.entries(s.totals.byCurrency).map(([cur, tt]) => <div key={cur} style={{ color: tt.solde >= 0 ? COLORS.collected : COLORS.remaining }}>{money(tt.solde, cur)}</div>) : <span style={{ color: "var(--ink-3)" }}>—</span>}</span>
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

