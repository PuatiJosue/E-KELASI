"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/Icon";
import { classKey } from "@/lib/classes";
import { Modal, Labeled, ModalActions, COLORS, selStyle, modalInp, iconBtn, errBox } from "../finance-ui";
import { money } from "../finance-export";
import { createFee, updateFee, type InstallmentInput } from "../actions/fees";
import type { Fee, FeeKind } from "@/lib/finance/fees";
import type { ClassOption } from "./types";

// ── Modale création / modification d’un frais ────────────────────────
export function FeeFormModal({ kind, existing, classes, year, onClose, onDone }: { kind: FeeKind; existing: Fee | null; classes: ClassOption[]; year: string; onClose: () => void; onDone: () => void }) {
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
  const [dueDate, setDueDate] = useState(existing?.dueDate ?? "");
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
          const r = await createFee({ kind, label: effLabel, className: t ? t.className : null, option: t ? t.option : null, schoolYear: year, totalAmount: parsedTotal, currency, dueDate: dueDate || null, installments });
          if (!r.ok) { setError(r.message); return; }
        }
        onDone();
      });
      return;
    }

    if (existing?.hasPayments && !confirm("Cette rubrique contient déjà des paiements. Voulez-vous vraiment enregistrer les modifications ?")) return;

    start(async () => {
      const r = existing
        ? await updateFee({ id: existing.id, label: effLabel, category: isScol ? null : category.trim(), className: className || null, option: option || null, totalAmount: parsedTotal, currency, dueDate: dueDate || null, installments })
        : await createFee({ kind, label: effLabel, category: isScol ? null : category.trim(), className: className || null, option: option || null, schoolYear: year, totalAmount: parsedTotal, currency, dueDate: dueDate || null, installments });
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
            <select value={classKeyVal} onChange={(e) => setClassKeyVal(e.target.value)} style={modalInp}>
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
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Labeled label="Montant total" style={{ flex: 1, minWidth: 130 }}><input value={totalAmount} onChange={(e) => setTotalAmount(e.target.value.replace(/[^\d.,]/g, ""))} inputMode="decimal" placeholder="250000" style={modalInp} /></Labeled>
        <Labeled label="Devise" style={{ width: 96 }}><select value={currency} onChange={(e) => setCurrency(e.target.value)} style={modalInp}><option value="CDF">CDF</option><option value="USD">USD</option></select></Labeled>
        <Labeled label="Échéance (facultatif)" style={{ flex: 1, minWidth: 150 }}><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} title="Date limite de paiement du frais" style={modalInp} /></Labeled>
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

      {existing?.hasPayments && <div style={{ fontSize: 11.5, color: "var(--ink-3)", lineHeight: 1.4 }}>Cette rubrique contient déjà des paiements. La modification reste possible (une confirmation sera demandée). La suppression reste possible aussi, mais elle efface définitivement les paiements — préférez l’archivage pour simplement masquer la rubrique.</div>}
      {error && <div style={errBox}>{error}</div>}
      <ModalActions onClose={onClose} onSubmit={submit} pending={pending} submitLabel={existing ? "Enregistrer" : "Créer le frais"} />
    </Modal>
  );
}

