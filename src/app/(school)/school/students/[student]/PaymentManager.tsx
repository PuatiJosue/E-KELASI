"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import { recordStudentPayment, deleteStudentPayment } from "../../finances/actions";
import type { StudentPayment } from "@/lib/finance-db";

const CURRENCIES = ["USD", "CDF"];

function fmtAmount(a: number, c: string) {
  return `${a.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${c === "CDF" ? "FC" : c}`;
}
function fmtDate(d: string) {
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export function PaymentManager({ studentId, payments }: { studentId: string; payments: StudentPayment[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [label, setLabel] = useState("");
  const [comment, setComment] = useState("");
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10));

  const totals = payments.reduce<Record<string, number>>((acc, p) => {
    acc[p.currency] = (acc[p.currency] ?? 0) + p.amount;
    return acc;
  }, {});

  const reset = () => {
    setAmount(""); setCurrency("USD"); setLabel(""); setComment("");
    setPaidAt(new Date().toISOString().slice(0, 10));
    if (fileRef.current) fileRef.current.value = "";
    setError(null);
  };

  const submit = async () => {
    setError(null);
    const amt = parseFloat(amount.replace(",", "."));
    if (!(amt > 0)) { setError("Entrez un montant valide."); return; }

    let receiptUrl: string | undefined;
    const file = fileRef.current?.files?.[0];
    if (file) {
      setUploading(true);
      try {
        const supabase = createClient();
        const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
        const path = `${studentId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("fee-receipts").upload(path, file, { upsert: false });
        if (upErr) { setUploading(false); setError("Échec de l'envoi du reçu."); return; }
        receiptUrl = supabase.storage.from("fee-receipts").getPublicUrl(path).data.publicUrl;
      } catch {
        setUploading(false); setError("Échec de l'envoi du reçu."); return;
      }
      setUploading(false);
    }

    startTransition(async () => {
      const r = await recordStudentPayment({
        studentId, amount: amt, currency, label, comment, receiptUrl, paidAt,
      });
      if (r.ok) { reset(); setOpen(false); router.refresh(); }
      else setError(r.message);
    });
  };

  const remove = (id: string) => {
    if (!confirm("Supprimer ce paiement ?")) return;
    startTransition(async () => {
      const r = await deleteStudentPayment(id, studentId);
      if (r.ok) router.refresh();
      else alert(r.message);
    });
  };

  return (
    <div className="ek-card" style={{ padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
        <div style={{ flex: 1, fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          <T fr="Frais scolaires / minerval" en="School fees" />
        </div>
        <button onClick={() => setOpen((v) => !v)} className="ek-btn ek-btn-primary" style={{ height: 30, fontSize: 12 }}>
          <Icon name={open ? "close" : "plus"} size={13} />
          {open ? <T fr="Fermer" en="Close" /> : <T fr="Enregistrer un paiement" en="Record payment" />}
        </button>
      </div>

      {/* Totaux */}
      {Object.keys(totals).length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          {Object.entries(totals).map(([c, t]) => (
            <div key={c} style={{ padding: "6px 12px", borderRadius: 8, background: "var(--brand-soft)", fontSize: 13, fontWeight: 700, color: "var(--brand-600)" }}>
              {fmtAmount(t, c)} <span style={{ fontWeight: 500, color: "var(--ink-3)", fontSize: 11 }}>au total</span>
            </div>
          ))}
        </div>
      )}

      {/* Formulaire */}
      {open && (
        <div style={{ padding: 14, borderRadius: 10, background: "var(--surface-2)", marginBottom: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 120 }}>
              <FieldLabel>Montant</FieldLabel>
              <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))} placeholder="50" inputMode="decimal" style={inp} />
            </div>
            <div style={{ width: 90 }}>
              <FieldLabel>Devise</FieldLabel>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={inp}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c === "CDF" ? "FC" : c}</option>)}
              </select>
            </div>
            <div style={{ width: 150 }}>
              <FieldLabel>Date</FieldLabel>
              <input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} style={inp} />
            </div>
          </div>
          <div>
            <FieldLabel>Libellé (optionnel)</FieldLabel>
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="ex. 1ère tranche, minerval…" style={inp} />
          </div>
          <div>
            <FieldLabel>Commentaire (optionnel)</FieldLabel>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} placeholder="Remarque…" style={{ ...inp, resize: "vertical" as const }} />
          </div>
          <div>
            <FieldLabel>Reçu (photo / scan, optionnel)</FieldLabel>
            <input ref={fileRef} type="file" accept="image/*,application/pdf" capture="environment" style={{ fontSize: 12.5, color: "var(--ink-2)" }} />
          </div>
          {error && <div style={{ color: "var(--danger)", fontSize: 12, fontWeight: 600 }}>{error}</div>}
          <button onClick={submit} disabled={pending || uploading} className="ek-btn ek-btn-primary" style={{ height: 36, fontSize: 13, opacity: pending || uploading ? 0.6 : 1 }}>
            {uploading ? "Envoi du reçu…" : pending ? "Enregistrement…" : <T fr="Enregistrer" en="Save" />}
          </button>
        </div>
      )}

      {/* Historique */}
      {payments.length === 0 ? (
        <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>
          <T fr="Aucun paiement enregistré." en="No payment recorded." />
        </div>
      ) : (
        <div>
          {payments.map((p, i) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderTop: i > 0 ? "1px solid var(--divider)" : "none" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
                  {fmtAmount(p.amount, p.currency)}
                  {p.label ? <span style={{ fontWeight: 500, color: "var(--ink-3)", fontSize: 12 }}> · {p.label}</span> : null}
                </div>
                <div style={{ fontSize: 11, color: "var(--ink-3)" }}>
                  {fmtDate(p.paidAt)}{p.recordedBy ? ` · ${p.recordedBy}` : ""}{p.comment ? ` · ${p.comment}` : ""}
                </div>
              </div>
              <a href={`/school/receipts/${p.id}`} target="_blank" rel="noreferrer" className="ek-btn ek-btn-outline" style={{ height: 28, fontSize: 11.5 }}>
                <Icon name="file" size={12} /> <T fr="Reçu" en="Receipt" />
              </a>
              {p.receiptUrl && (
                <a href={p.receiptUrl} target="_blank" rel="noreferrer" className="ek-btn ek-btn-outline" style={{ height: 28, fontSize: 11.5 }}>
                  <Icon name="file" size={12} /> <T fr="Scan" en="Scan" />
                </a>
              )}
              <button onClick={() => remove(p.id)} disabled={pending} title="Supprimer" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-3)", display: "flex", padding: 4 }}>
                <Icon name="trash" size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const inp: React.CSSProperties = {
  width: "100%", padding: "9px 10px", borderRadius: 9, border: "1px solid var(--border-strong)",
  background: "var(--surface)", fontSize: 13, color: "var(--ink)",
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-2)", marginBottom: 4 }}>{children}</div>;
}
