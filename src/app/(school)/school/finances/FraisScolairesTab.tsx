"use client";

import { useMemo, useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { Avatar } from "@/components/Avatar";
import { SexBadge } from "@/components/SexBadge";
import { classKey } from "@/lib/classes";
import {
  Kpi, MoneyLines, Chip, Modal, Labeled, ModalActions, Toolbar, SearchInput, StackedBars, RecoveryBar,
  STUDENT_STATUS, COLORS, selStyle, modalInp, iconBtn, errBox, type SchoolBranding,
} from "./finance-ui";
import { money, escHtml, openPrint, downloadCsv, buildInvoiceHtml, reportHead, REPORT_CSS } from "./finance-export";
import {
  createFee, updateFee, deleteFee, archiveFee, recordFeePayment, cancelFeePayment,
  setFeeOverride, removeFeeOverride, loadFeeDetail, loadFeePayments, sendInvoiceToParent, type InstallmentInput,
} from "./actions-v2";
import type { FeesOverview, Fee, FeeDetail, FeeStudentRow, FeeKind } from "@/lib/finance/fees";
import type { FeePayment } from "@/lib/finance/payments";

export type ClassOption = { className: string; option: string | null; display: string };

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

// ── Ligne d’un frais ─────────────────────────────────────────────────
function FeeRow({ fee, first, onOpen, onEdit, onChanged }: { fee: Fee; first: boolean; onOpen: () => void; onEdit: () => void; onChanged: () => void }) {
  const [pending, start] = useTransition();
  const del = () => {
    if (!confirm(`Supprimer le frais « ${fee.label} » ?`)) return;
    start(async () => { const r = await deleteFee(fee.id); if (!r.ok) alert(r.message); else onChanged(); });
  };
  const arch = () => start(async () => { const r = await archiveFee(fee.id, !fee.archived); if (!r.ok) alert(r.message); else onChanged(); });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderTop: first ? "none" : "1px solid var(--divider)", opacity: fee.archived ? 0.55 : 1 }}>
      <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={onOpen}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{fee.label}</span>
          <span style={{ fontSize: 11, color: "var(--ink-3)" }}>· {fee.classDisplay ?? "École entière"}</span>
          {fee.installments.length > 0 && <span style={{ fontSize: 10.5, color: "var(--ink-3)" }}>· {fee.installments.length} tranche(s)</span>}
          {fee.archived && <span style={{ fontSize: 10.5, color: "var(--ink-3)" }}>· archivé</span>}
        </div>
        <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>
          Total {money(fee.totalAmount, fee.currency)} · {fee.studentCount} élève(s) · Attendu {money(fee.expected, fee.currency)} · Encaissé <span style={{ color: COLORS.collected }}>{money(fee.collected, fee.currency)}</span> · Reste <span style={{ color: COLORS.remaining }}>{money(fee.remaining, fee.currency)}</span>
        </div>
        <div style={{ marginTop: 6, maxWidth: 260 }}><RecoveryBar pct={fee.recoveryPct} /></div>
      </div>
      <button onClick={onOpen} className="ek-btn ek-btn-outline" style={{ height: 32, fontSize: 12 }}>Paiements</button>
      {!fee.hasPayments && <button onClick={onEdit} title="Modifier" style={iconBtn}><Icon name="edit" size={15} /></button>}
      <button onClick={arch} disabled={pending} title={fee.archived ? "Réactiver" : "Archiver"} style={iconBtn}><Icon name={fee.archived ? "refresh" : "eyeOff"} size={15} /></button>
      <button onClick={del} disabled={pending} title="Supprimer" style={iconBtn}><Icon name="trash" size={15} /></button>
    </div>
  );
}

// ── Modale création / modification d’un frais ────────────────────────
function FeeFormModal({ kind, existing, classes, year, onClose, onDone }: { kind: FeeKind; existing: Fee | null; classes: ClassOption[]; year: string; onClose: () => void; onDone: () => void }) {
  const isScol = kind === "scolaire";
  const [pending, start] = useTransition();
  const [label, setLabel] = useState(existing?.label ?? "");
  const [category, setCategory] = useState(existing?.category ?? existing?.label ?? "");
  const [classKeyVal, setClassKeyVal] = useState(existing ? classKey(existing.className, existing.option) : (classes[0] ? classKey(classes[0].className, classes[0].option) : ""));
  // Cible (frais scolaire à la création) : toutes les classes ou une sélection.
  const [scope, setScope] = useState<"all" | "specific">("specific");
  const [picked, setPicked] = useState<Set<string>>(() => new Set(existing || !classes[0] ? [] : [classKey(classes[0].className, classes[0].option)]));
  const togglePick = (ck: string) => setPicked((p) => { const n = new Set(p); n.has(ck) ? n.delete(ck) : n.add(ck); return n; });
  const [totalAmount, setTotalAmount] = useState(existing ? String(existing.totalAmount) : "");
  const [currency, setCurrency] = useState(existing?.currency ?? "CDF");
  const [rows, setRows] = useState<{ name: string; amount: string; dueDate: string }[]>(
    existing?.installments.length ? existing.installments.map((i) => ({ name: i.name, amount: String(i.amount), dueDate: i.dueDate ?? "" })) : []
  );
  const [error, setError] = useState<string | null>(null);

  const parsedTotal = parseFloat(totalAmount.replace(",", ".")) || 0;
  const trancheSum = rows.reduce((a, r) => a + (parseFloat(r.amount.replace(",", ".")) || 0), 0);

  const addRow = () => setRows((p) => [...p, { name: `Tranche ${p.length + 1}`, amount: "", dueDate: "" }]);
  const setRow = (idx: number, patch: Partial<{ name: string; amount: string; dueDate: string }>) => setRows((p) => p.map((r, i) => i === idx ? { ...r, ...patch } : r));
  const delRow = (idx: number) => setRows((p) => p.filter((_, i) => i !== idx));

  const submit = () => {
    setError(null);
    const effLabel = (isScol ? label : (label.trim() || category)).trim();
    if (isScol && !label.trim()) { setError("Libellé requis."); return; }
    if (!isScol && !category.trim()) { setError("Nom de la catégorie requis."); return; }
    if (!(parsedTotal > 0)) { setError("Montant total invalide."); return; }
    if (rows.length > 0 && Math.abs(trancheSum - parsedTotal) > 0.5) {
      if (!confirm(`La somme des tranches (${money(trancheSum, currency)}) diffère du total (${money(parsedTotal, currency)}). Continuer ?`)) return;
    }
    const chosen = classes.find((cl) => classKey(cl.className, cl.option) === classKeyVal);
    const className = chosen?.className ?? existing?.className ?? null;
    const option = chosen?.option ?? existing?.option ?? null;
    const installments: InstallmentInput[] = rows
      .filter((r) => r.name.trim() && (parseFloat(r.amount.replace(",", ".")) || 0) > 0)
      .map((r) => ({ name: r.name.trim(), amount: parseFloat(r.amount.replace(",", ".")) || 0, dueDate: r.dueDate || null }));

    // Frais scolaire à la création : toutes les classes (class_name null) ou N classes choisies.
    if (isScol && !existing) {
      const targets = scope === "all" ? [null] : classes.filter((cl) => picked.has(classKey(cl.className, cl.option)));
      if (scope === "specific" && targets.length === 0) { setError("Sélectionnez au moins une classe."); return; }
      start(async () => {
        for (const t of targets as (ClassOption | null)[]) {
          const r = await createFee({ kind, label: effLabel, className: t ? t.className : null, option: t ? t.option : null, schoolYear: year, totalAmount: parsedTotal, currency, installments });
          if (!r.ok) { setError(r.message); return; }
        }
        onDone();
      });
      return;
    }

    start(async () => {
      const r = existing
        ? await updateFee({ id: existing.id, label: effLabel, category: isScol ? null : category.trim(), className: className || null, option: option || null, totalAmount: parsedTotal, currency, installments })
        : await createFee({ kind, label: effLabel, category: isScol ? null : category.trim(), className: className || null, option: option || null, schoolYear: year, totalAmount: parsedTotal, currency, installments });
      if (r.ok) onDone(); else setError(r.message);
    });
  };

  return (
    <Modal title={existing ? (isScol ? "Modifier le frais" : "Modifier la catégorie") : "Ajouter une rubrique"} onClose={onClose} wide>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Labeled label="Année scolaire" style={{ flex: 1, minWidth: 140 }}>
          <input value={year} disabled style={{ ...modalInp, opacity: 0.7 }} />
        </Labeled>
        {isScol && !existing ? (
          <Labeled label="Cible" style={{ flex: 1, minWidth: 180 }}>
            <select value={scope} onChange={(e) => setScope(e.target.value as "all" | "specific")} style={modalInp}>
              <option value="all">Toutes les classes</option>
              <option value="specific">Classes spécifiques…</option>
            </select>
          </Labeled>
        ) : (
          <Labeled label={isScol ? "Niveau / classe" : "Cible"} style={{ flex: 1, minWidth: 180 }}>
            <select value={classKeyVal} onChange={(e) => setClassKeyVal(e.target.value)} style={modalInp} disabled={!!existing && existing.hasPayments}>
              {!isScol && <option value="">École entière</option>}
              {isScol && classes.length === 0 && <option value="">— aucune classe —</option>}
              {classes.map((cl) => { const ck = classKey(cl.className, cl.option); return <option key={ck} value={ck}>{cl.display}</option>; })}
            </select>
          </Labeled>
        )}
      </div>
      {isScol && !existing && scope === "specific" && (
        <div style={{ border: "1px solid var(--border-strong)", borderRadius: 9, padding: 8, maxHeight: 170, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
          {classes.length === 0 ? (
            <div style={{ fontSize: 12, color: "var(--ink-3)" }}>Aucune classe active.</div>
          ) : classes.map((cl) => { const ck = classKey(cl.className, cl.option); return (
            <label key={ck} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--ink-2)", cursor: "pointer" }}>
              <input type="checkbox" checked={picked.has(ck)} onChange={() => togglePick(ck)} /> {cl.display}
            </label>
          ); })}
          <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>Un frais identique sera créé pour chaque classe cochée.</div>
        </div>
      )}
      {isScol ? (
        <Labeled label="Libellé du frais"><input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Minerval, Frais d’examen…" style={modalInp} /></Labeled>
      ) : (
        <Labeled label="Nom de la catégorie"><input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Uniforme, Transport, Cantine…" style={modalInp} /></Labeled>
      )}
      <div style={{ display: "flex", gap: 10 }}>
        <Labeled label="Montant total" style={{ flex: 1 }}><input value={totalAmount} onChange={(e) => setTotalAmount(e.target.value.replace(/[^\d.,]/g, ""))} inputMode="decimal" placeholder="250000" style={modalInp} /></Labeled>
        <Labeled label="Devise" style={{ width: 110 }}><select value={currency} onChange={(e) => setCurrency(e.target.value)} style={modalInp}><option value="CDF">CDF</option><option value="USD">USD</option></select></Labeled>
      </div>

      {/* Tranches */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)", flex: 1 }}>Tranches de paiement (facultatif)</span>
          <button onClick={addRow} className="ek-btn ek-btn-outline" style={{ height: 28, fontSize: 11.5 }}><Icon name="plus" size={12} /> Ajouter</button>
        </div>
        {rows.map((r, i) => (
          <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input value={r.name} onChange={(e) => setRow(i, { name: e.target.value })} placeholder={`Tranche ${i + 1}`} style={{ ...modalInp, flex: 1.4 }} />
            <input value={r.amount} onChange={(e) => setRow(i, { amount: e.target.value.replace(/[^\d.,]/g, "") })} inputMode="decimal" placeholder="Montant" style={{ ...modalInp, flex: 1 }} />
            <input type="date" value={r.dueDate} onChange={(e) => setRow(i, { dueDate: e.target.value })} title="Échéance (facultatif)" style={{ ...modalInp, flex: 1 }} />
            <button onClick={() => delRow(i)} style={iconBtn} title="Retirer"><Icon name="trash" size={14} /></button>
          </div>
        ))}
        {rows.length > 0 && (
          <div style={{ fontSize: 11.5, color: Math.abs(trancheSum - parsedTotal) > 0.5 ? COLORS.remaining : "var(--ink-3)", textAlign: "right" }}>
            Somme des tranches : {money(trancheSum, currency)} / Total {money(parsedTotal, currency)}
          </div>
        )}
      </div>

      {existing?.hasPayments && <div style={errBox}>Des paiements existent : la classe n’est plus modifiable.</div>}
      {error && <div style={errBox}>{error}</div>}
      <ModalActions onClose={onClose} onSubmit={submit} pending={pending} submitLabel={existing ? "Enregistrer" : "Créer le frais"} />
    </Modal>
  );
}

// ── Modale détail d’un frais (situation par élève + paiements) ───────
function FeeDetailModal({ fee: initFee, school, year, onClose }: { fee: Fee; school: SchoolBranding; year: string; onClose: () => void }) {
  const [detail, setDetail] = useState<FeeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusF, setStatusF] = useState("");
  const [payFor, setPayFor] = useState<FeeStudentRow | null>(null);
  const [ovrFor, setOvrFor] = useState<FeeStudentRow | null>(null);
  const [histFor, setHistFor] = useState<FeeStudentRow | null>(null);

  const reload = () => { setLoading(true); loadFeeDetail(initFee.id).then((d) => { setDetail(d); setLoading(false); }); };
  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [initFee.id]);

  const fee = detail?.fee ?? initFee;
  const c = fee.currency;
  const q = query.trim().toLowerCase();
  const students = (detail?.students ?? []).filter((s) => {
    if (statusF && s.status !== statusF) return false;
    if (q && !s.fullName.toLowerCase().includes(q) && !s.matricule.toLowerCase().includes(q)) return false;
    return true;
  });

  return (
    <Modal title={`${fee.label}${fee.classDisplay ? ` · ${fee.classDisplay}` : ""}`} onClose={onClose} wide maximizable>
      {(maximized) => (
      <>
      {/* Résumé */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px,1fr))", gap: 1, background: "var(--border)", borderRadius: 10, overflow: "hidden" }}>
        <MiniStat label="Total / élève" value={money(fee.totalAmount, c)} color="var(--ink)" />
        <MiniStat label="Attendu" value={money(fee.expected, c)} color="var(--ink)" />
        <MiniStat label="Encaissé" value={money(fee.collected, c)} color={COLORS.collected} />
        <MiniStat label="Restant" value={money(fee.remaining, c)} color={COLORS.remaining} />
        <MiniStat label="Recouvrement" value={`${fee.recoveryPct.toFixed(0)} %`} color={COLORS.brand} />
      </div>

      <Toolbar>
        <SearchInput value={query} onChange={setQuery} placeholder="Rechercher un élève…" />
        <select value={statusF} onChange={(e) => setStatusF(e.target.value)} style={{ ...selStyle, height: 38 }}>
          <option value="">Tous statuts</option>
          <option value="paye">Payé</option>
          <option value="partiel">Partiellement payé</option>
          <option value="impaye">Impayé</option>
        </select>
      </Toolbar>

      {loading && !detail ? (
        <div style={{ padding: 20, color: "var(--ink-3)", fontSize: 13 }}>Chargement…</div>
      ) : (
        <div className="ek-tablewrap" style={maximized ? { flex: 1, minHeight: 0, overflowY: "auto" } : { maxHeight: "42vh", overflowY: "auto" }}>
          <div style={{ minWidth: 620 }}>
            <div style={{ display: "grid", gridTemplateColumns: DET_GRID, padding: "8px 4px", fontSize: 10, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.03em", borderBottom: "1px solid var(--divider)", position: "sticky", top: 0, background: "var(--surface)" }}>
              <div>Élève</div><div style={{ textAlign: "right" }}>Attendu</div><div style={{ textAlign: "right" }}>Payé</div><div style={{ textAlign: "right" }}>Reste</div><div>Statut</div><div style={{ textAlign: "center" }}>Actions</div>
            </div>
            {students.length === 0 ? (
              <div style={{ padding: 16, color: "var(--ink-3)", fontSize: 12.5 }}>Aucun élève.</div>
            ) : students.map((s) => (
              <div key={s.studentId} style={{ display: "grid", gridTemplateColumns: DET_GRID, padding: "9px 4px", alignItems: "center", fontSize: 12, borderBottom: "1px solid var(--divider)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                  <Avatar name={s.fullName} url={s.avatarUrl} size={26} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.fullName}</span>
                      <SexBadge sex={s.sex} size={13} />
                    </div>
                    {s.overrideAmount != null && <div style={{ fontSize: 10, color: COLORS.accent }}>ajusté</div>}
                  </div>
                </div>
                <div style={{ textAlign: "right", fontWeight: 600 }}>{money(s.expected, c)}</div>
                <div style={{ textAlign: "right", color: COLORS.collected, fontWeight: 600 }}>{money(s.paid, c)}</div>
                <div style={{ textAlign: "right", color: s.remaining > 0 ? COLORS.remaining : "var(--ink-3)", fontWeight: 600 }}>{money(s.remaining, c)}</div>
                <div><Chip {...STUDENT_STATUS[s.status]} /></div>
                <div style={{ display: "flex", justifyContent: "center", gap: 2 }}>
                  <button onClick={() => setPayFor(s)} title="Encaisser" style={iconBtn}><Icon name="plus" size={14} stroke={2.5} /></button>
                  <button onClick={() => setHistFor(s)} title="Historique / factures" style={iconBtn}><Icon name="clock" size={14} /></button>
                  <button onClick={() => setOvrFor(s)} title="Ajuster / exonérer" style={iconBtn}><Icon name="edit" size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button onClick={() => exportFeeStudentsPdf(fee, students, school, year)} className="ek-btn ek-btn-outline" style={{ height: 34, fontSize: 12 }}><Icon name="file" size={13} /> PDF</button>
        <button onClick={() => exportFeeStudentsCsv(fee, students)} className="ek-btn ek-btn-outline" style={{ height: 34, fontSize: 12 }}><Icon name="download" size={13} /> Excel</button>
        <button onClick={onClose} className="ek-btn ek-btn-primary" style={{ height: 34, fontSize: 12 }}>Fermer</button>
      </div>

      {payFor && <PaymentModal fee={fee} student={payFor} school={school} year={year} onClose={() => setPayFor(null)} onDone={() => { setPayFor(null); reload(); }} />}
      {ovrFor && <OverrideModal fee={fee} student={ovrFor} onClose={() => setOvrFor(null)} onDone={() => { setOvrFor(null); reload(); }} />}
      {histFor && <StudentHistoryModal fee={fee} student={histFor} school={school} year={year} onClose={() => setHistFor(null)} onChanged={reload} />}
      </>
      )}
    </Modal>
  );
}

const DET_GRID = "1.8fr 1fr 1fr 1fr 1.2fr 1fr";

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ padding: "10px 12px", background: "var(--surface)" }}>
      <div style={{ fontSize: 9.5, color: "var(--ink-3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 800, color, marginTop: 3, fontFamily: "var(--font-display)" }}>{value}</div>
    </div>
  );
}

// ── Encaissement → facture ───────────────────────────────────────────
function PaymentModal({ fee, student, school, year, onClose, onDone }: { fee: Fee; student: FeeStudentRow; school: SchoolBranding; year: string; onClose: () => void; onDone: () => void }) {
  const [pending, start] = useTransition();
  const [installmentId, setInstallmentId] = useState("");
  const [amount, setAmount] = useState(String(student.remaining || student.expected));
  const [invoiceNo, setInvoiceNo] = useState("");
  const [cashier, setCashier] = useState(school.directorName ?? "");
  const [dateTime, setDateTime] = useState(localDateTime());
  const [libelle, setLibelle] = useState("");
  const [printAfter, setPrintAfter] = useState(true);
  const [sendParent, setSendParent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inst = fee.installments.find((i) => i.id === installmentId) ?? null;
  const pickInstallment = (id: string) => {
    setInstallmentId(id);
    const it = fee.installments.find((x) => x.id === id);
    if (it) setAmount(String(it.amount));
  };

  const submit = () => {
    const amt = parseFloat(amount.replace(",", ".")) || 0;
    if (!(amt > 0)) { setError("Montant invalide."); return; }
    start(async () => {
      const r = await recordFeePayment({
        feeId: fee.id, studentId: student.studentId, installmentId: installmentId || null,
        amount: amt, currency: fee.currency, paidAt: new Date(dateTime).toISOString(),
        invoiceNo, cashierName: cashier, note: libelle,
      });
      if (!r.ok) { setError(r.message); return; }
      if (printAfter) {
        openPrint(buildInvoiceHtml(school, {
          invoiceNo, dateTime, schoolYear: year, studentName: student.fullName, className: student.classDisplay,
          feeLabel: fee.label, installmentName: inst?.name ?? null, totalAmount: student.expected, paidAmount: amt,
          currency: fee.currency, cashierName: cashier,
        }));
      }
      if (sendParent) {
        const sr = await sendInvoiceToParent({ studentId: student.studentId, feeLabel: fee.label, amount: amt, currency: fee.currency, invoiceNo });
        if (!sr.ok) alert(`Facture enregistrée, mais envoi au parent impossible : ${sr.message}`);
      }
      onDone();
    });
  };

  return (
    <Modal title={`Encaisser · ${student.fullName}`} onClose={onClose}>
      <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
        {fee.label} · Attendu {money(student.expected, fee.currency)} · Déjà payé {money(student.paid, fee.currency)} · Reste <span style={{ color: COLORS.remaining, fontWeight: 700 }}>{money(student.remaining, fee.currency)}</span>
      </div>
      {fee.installments.length > 0 && (
        <Labeled label="Tranche (facultatif)">
          <select value={installmentId} onChange={(e) => pickInstallment(e.target.value)} style={modalInp}>
            <option value="">— paiement libre —</option>
            {fee.installments.map((i) => <option key={i.id} value={i.id}>{i.name} · {money(i.amount, fee.currency)}{i.dueDate ? ` · échéance ${new Date(i.dueDate).toLocaleDateString("fr-FR")}` : ""}</option>)}
          </select>
        </Labeled>
      )}
      <Labeled label="Montant payé"><input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))} inputMode="decimal" style={modalInp} /></Labeled>
      <div style={{ display: "flex", gap: 10 }}>
        <Labeled label="N° de facture" style={{ flex: 1 }}><input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} placeholder="00125" style={modalInp} /></Labeled>
        <Labeled label="Date & heure" style={{ flex: 1 }}><input type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} style={modalInp} /></Labeled>
      </div>
      <Labeled label="Caissier / utilisateur"><input value={cashier} onChange={(e) => setCashier(e.target.value)} placeholder="Nom du caissier" style={modalInp} /></Labeled>
      <Labeled label="Libellé (facultatif)">
        <textarea value={libelle} onChange={(e) => setLibelle(e.target.value)} placeholder="Motif, précision sur ce paiement…"
          style={{ ...modalInp, minHeight: 56, resize: "vertical", fontFamily: "inherit", lineHeight: 1.4 }} />
      </Labeled>
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--ink-2)" }}>
        <input type="checkbox" checked={printAfter} onChange={(e) => setPrintAfter(e.target.checked)} /> Générer et imprimer la facture
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--ink-2)" }}>
        <input type="checkbox" checked={sendParent} onChange={(e) => setSendParent(e.target.checked)} /> Envoyer la facture au parent (notification)
      </label>
      {error && <div style={errBox}>{error}</div>}
      <ModalActions onClose={onClose} onSubmit={submit} pending={pending} submitLabel="Encaisser" />
    </Modal>
  );
}

// ── Ajustement / exonération ─────────────────────────────────────────
function OverrideModal({ fee, student, onClose, onDone }: { fee: Fee; student: FeeStudentRow; onClose: () => void; onDone: () => void }) {
  const [pending, start] = useTransition();
  const [amount, setAmount] = useState(String(student.overrideAmount ?? student.expected));
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const save = () => {
    const amt = parseFloat(amount.replace(",", ".")) || 0;
    if (amt < 0) { setError("Montant invalide."); return; }
    start(async () => { const r = await setFeeOverride({ feeId: fee.id, studentId: student.studentId, amount: amt, reason }); if (r.ok) onDone(); else setError(r.message); });
  };
  const reset = () => start(async () => { const r = await removeFeeOverride(fee.id, student.studentId); if (r.ok) onDone(); else setError(r.message); });
  return (
    <Modal title={`Ajuster le montant · ${student.fullName}`} onClose={onClose}>
      <div style={{ fontSize: 12, color: "var(--ink-3)" }}>Montant par défaut du frais : {money(fee.totalAmount, fee.currency)}. Saisissez un montant réduit (bourse, cas social) ou 0 pour exonérer.</div>
      <Labeled label="Montant attendu pour cet élève"><input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))} inputMode="decimal" style={modalInp} /></Labeled>
      <Labeled label="Motif (facultatif)"><input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Bourse, fratrie…" style={modalInp} /></Labeled>
      {error && <div style={errBox}>{error}</div>}
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        {student.overrideAmount != null && <button onClick={reset} disabled={pending} className="ek-btn ek-btn-outline" style={{ flex: 1 }}>Rétablir</button>}
        <button onClick={onClose} className="ek-btn ek-btn-outline" style={{ flex: 1 }}>Annuler</button>
        <button onClick={save} disabled={pending} className="ek-btn ek-btn-primary" style={{ flex: 1, opacity: pending ? 0.6 : 1 }}>{pending ? "…" : "Enregistrer"}</button>
      </div>
    </Modal>
  );
}

// ── Historique / factures d’un élève sur ce frais ────────────────────
function StudentHistoryModal({ fee, student, school, year, onClose, onChanged }: { fee: Fee; student: FeeStudentRow; school: SchoolBranding; year: string; onClose: () => void; onChanged: () => void }) {
  const [payments, setPayments] = useState<FeePayment[] | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const load = () => loadFeePayments(fee.id, student.studentId).then(setPayments);
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [fee.id, student.studentId]);

  const reprint = (p: FeePayment) => openPrint(buildInvoiceHtml(school, {
    invoiceNo: p.invoiceNo ?? "", dateTime: p.paidAt, schoolYear: year, studentName: student.fullName, className: student.classDisplay,
    feeLabel: fee.label, installmentName: p.installmentName, totalAmount: student.expected, paidAmount: p.amount, currency: p.currency, cashierName: p.cashierName ?? "",
  }));

  return (
    <Modal title={`Historique · ${student.fullName}`} onClose={onClose}>
      <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{fee.label} · Payé {money(student.paid, fee.currency)} · Reste {money(student.remaining, fee.currency)}</div>
      {payments == null ? (
        <div style={{ color: "var(--ink-3)", fontSize: 12.5 }}>Chargement…</div>
      ) : payments.length === 0 ? (
        <div style={{ color: "var(--ink-3)", fontSize: 12.5 }}>Aucun paiement enregistré.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: "50vh", overflowY: "auto" }}>
          {payments.map((p) => {
            const cancelled = !!p.cancelledAt;
            return (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, borderBottom: "1px solid var(--divider)", padding: "8px 0", opacity: cancelled ? 0.55 : 1 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div><span style={{ fontWeight: 700, textDecoration: cancelled ? "line-through" : "none" }}>{money(p.amount, p.currency)}</span>{p.installmentName ? ` · ${p.installmentName}` : ""}{p.invoiceNo ? ` · N° ${p.invoiceNo}` : ""}</div>
                  {p.note && <div style={{ fontSize: 11, color: "var(--ink-2)" }}>{p.note}</div>}
                  <div style={{ fontSize: 10.5, color: "var(--ink-3)" }}>{new Date(p.paidAt).toLocaleString("fr-FR")}{p.cashierName ? ` · ${p.cashierName}` : ""}{cancelled ? ` · Annulé : ${p.cancelReason ?? ""}` : ""}</div>
                </div>
                {!cancelled && <>
                  <button onClick={() => reprint(p)} title="Réimprimer la facture" style={iconBtn}><Icon name="file" size={14} /></button>
                  <button onClick={() => setCancelId(p.id)} title="Annuler" style={iconBtn}><Icon name="close" size={14} /></button>
                </>}
              </div>
            );
          })}
        </div>
      )}
      {cancelId && <CancelModal paymentId={cancelId} onClose={() => setCancelId(null)} onDone={() => { setCancelId(null); load(); onChanged(); }} />}
    </Modal>
  );
}

function CancelModal({ paymentId, onClose, onDone }: { paymentId: string; onClose: () => void; onDone: () => void }) {
  const [pending, start] = useTransition();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const submit = () => {
    if (!reason.trim()) { setError("Motif requis."); return; }
    start(async () => { const r = await cancelFeePayment(paymentId, reason); if (r.ok) onDone(); else setError(r.message); });
  };
  return (
    <Modal title="Annuler le paiement" onClose={onClose}>
      <div style={{ fontSize: 12, color: "var(--ink-3)" }}>Le paiement est conservé (annulation tracée), il n’est plus compté dans les recettes ni le solde.</div>
      <Labeled label="Motif d’annulation"><input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Erreur de saisie…" style={modalInp} /></Labeled>
      {error && <div style={errBox}>{error}</div>}
      <ModalActions onClose={onClose} onSubmit={submit} pending={pending} submitLabel="Confirmer l’annulation" />
    </Modal>
  );
}

// ── Utilitaires ──────────────────────────────────────────────────────
function localDateTime(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

// ── Exports ──────────────────────────────────────────────────────────
function exportFeesCsv(fees: Fee[], title: string) {
  const lines: (string | number)[][] = [[title], [], ["Frais", "Classe", "Montant total", "Élèves", "Attendu", "Encaissé", "Restant", "Recouvrement %"]];
  for (const f of fees) lines.push([f.label, f.classDisplay ?? "École entière", Math.round(f.totalAmount), f.studentCount, Math.round(f.expected), Math.round(f.collected), Math.round(f.remaining), f.recoveryPct.toFixed(0)]);
  downloadCsv(lines, `${title.toLowerCase().replace(/\s+/g, "-")}.csv`);
}
function exportFeesPdf(fees: Fee[], c: string, school: SchoolBranding, year: string, title: string) {
  const body = fees.map((f) => `<tr><td>${escHtml(f.label)}</td><td>${escHtml(f.classDisplay ?? "École entière")}</td><td class="r">${money(f.expected, c)}</td><td class="r" style="color:#16A34A">${money(f.collected, c)}</td><td class="r" style="color:#E11D48">${money(f.remaining, c)}</td><td class="r">${f.recoveryPct.toFixed(0)} %</td></tr>`).join("");
  const exp = fees.reduce((a, f) => a + f.expected, 0), col = fees.reduce((a, f) => a + f.collected, 0);
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${escHtml(title)}</title><style>${REPORT_CSS}</style></head><body>${reportHead(school)}<h1>${escHtml(title)} — ${escHtml(year)}</h1><table><thead><tr><th>Frais</th><th>Classe</th><th class="r">Attendu</th><th class="r">Encaissé</th><th class="r">Restant</th><th class="r">Recouvrement</th></tr></thead><tbody>${body}</tbody><tfoot><tr><td colspan="2">Total</td><td class="r">${money(exp, c)}</td><td class="r">${money(col, c)}</td><td class="r">${money(Math.max(0, exp - col), c)}</td><td class="r">${exp > 0 ? ((col / exp) * 100).toFixed(0) : 0} %</td></tr></tfoot></table><div class="foot">E-KELASI</div><script>window.onload=function(){window.print()}</script></body></html>`;
  openPrint(html);
}
function exportFeeStudentsCsv(fee: Fee, rows: FeeStudentRow[]) {
  const lines: (string | number)[][] = [[fee.label, fee.classDisplay ?? ""], [], ["Code", "Élève", "Attendu", "Payé", "Reste", "Statut"]];
  for (const s of rows) lines.push([s.matricule, s.fullName, Math.round(s.expected), Math.round(s.paid), Math.round(s.remaining), STUDENT_STATUS[s.status].label]);
  downloadCsv(lines, `frais-${fee.label}.csv`);
}
function exportFeeStudentsPdf(fee: Fee, rows: FeeStudentRow[], school: SchoolBranding, year: string) {
  const c = fee.currency;
  const body = rows.map((s) => `<tr><td>${escHtml(s.matricule)}</td><td>${escHtml(s.fullName)}</td><td class="r">${money(s.expected, c)}</td><td class="r" style="color:#16A34A">${money(s.paid, c)}</td><td class="r" style="color:#E11D48">${money(s.remaining, c)}</td><td>${STUDENT_STATUS[s.status].label}</td></tr>`).join("");
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${escHtml(fee.label)}</title><style>${REPORT_CSS}</style></head><body>${reportHead(school)}<h1>${escHtml(fee.label)}${fee.classDisplay ? ` — ${escHtml(fee.classDisplay)}` : ""}</h1><div class="sub">Année ${escHtml(year)} · ${rows.length} élève(s)</div><table><thead><tr><th>Code</th><th>Élève</th><th class="r">Attendu</th><th class="r">Payé</th><th class="r">Reste</th><th>Statut</th></tr></thead><tbody>${body}</tbody></table><div class="foot">E-KELASI</div><script>window.onload=function(){window.print()}</script></body></html>`;
  openPrint(html);
}
