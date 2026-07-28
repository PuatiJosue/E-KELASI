"use client";

import { useState, useTransition } from "react";
import { Modal, Labeled, ModalActions, modalInp, errBox } from "../finance-ui";
import { money } from "../finance-export";
import { setFeeOverride, removeFeeOverride } from "../actions/fees";
import type { Fee, FeeStudentRow } from "@/lib/finance/fees";

// ── Ajustement / exonération ─────────────────────────────────────────
export function OverrideModal({ fee, student, onClose, onDone }: { fee: Fee; student: FeeStudentRow; onClose: () => void; onDone: () => void }) {
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

