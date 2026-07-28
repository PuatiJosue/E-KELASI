"use client";

import { useState, useTransition } from "react";
import { Modal, Labeled, ModalActions, modalInp, errBox } from "../finance-ui";
import { money } from "../finance-export";
import { cancelTreasuryEntry } from "../actions-v2";
import type { TreasuryEntry } from "@/lib/finance/treasury";

export function CancelEntryModal({ entry, onClose, onDone }: { entry: TreasuryEntry; onClose: () => void; onDone: () => void }) {
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

