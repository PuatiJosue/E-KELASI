"use client";

import { useState, useTransition } from "react";
import { Modal, Labeled, ModalActions, COLORS, modalInp, errBox, type SchoolBranding } from "../finance-ui";
import { money, openPrint, buildInvoiceHtml } from "../finance-export";
import { recordFeePayment, sendInvoiceToParent } from "../actions/payments";
import { localDateTime } from "./exports";
import type { Fee, FeeStudentRow } from "@/lib/finance/fees";

// ── Encaissement → facture ───────────────────────────────────────────
export function PaymentModal({ fee, student, school, year, onClose, onDone }: { fee: Fee; student: FeeStudentRow; school: SchoolBranding; year: string; onClose: () => void; onDone: () => void }) {
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

