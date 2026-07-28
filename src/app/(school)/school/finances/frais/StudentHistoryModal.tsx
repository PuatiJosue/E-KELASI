"use client";

import { useEffect, useState, useTransition } from "react";
import { Icon } from "@/components/Icon";
import { Modal, Labeled, ModalActions, modalInp, errBox, iconBtn, type SchoolBranding } from "../finance-ui";
import { money, openPrint, buildInvoiceHtml } from "../finance-export";
import { loadFeePayments, cancelFeePayment } from "../actions-v2";
import type { Fee, FeeStudentRow } from "@/lib/finance/fees";
import type { FeePayment } from "@/lib/finance/payments";

// ── Historique / factures d’un élève sur ce frais ────────────────────
export function StudentHistoryModal({ fee, student, school, year, onClose, onChanged }: { fee: Fee; student: FeeStudentRow; school: SchoolBranding; year: string; onClose: () => void; onChanged: () => void }) {
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

