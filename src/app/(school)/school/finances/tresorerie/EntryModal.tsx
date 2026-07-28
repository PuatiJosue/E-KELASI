"use client";

import { useState, useTransition } from "react";
import { Modal, Labeled, ModalActions, modalInp, errBox } from "../finance-ui";
import { addTreasuryEntry, updateTreasuryEntry } from "../actions-v2";
import type { TreasuryEntry, TreasuryKind } from "@/lib/finance/treasury";
import { KIND_LABEL, EXC_CATEGORIES } from "./constants";

// ── Modale création / modification d’une opération ───────────────────
export function EntryModal({ kind, entry, year, onClose, onDone }: { kind: TreasuryKind; entry?: TreasuryEntry; year: string; onClose: () => void; onDone: () => void }) {
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

