"use client";

import { useMemo, useState, useTransition, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { SexBadge } from "@/components/SexBadge";
import { T } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import { recordStudentPayment } from "./actions";
import type { FeeSummaryRow } from "@/lib/finance-db";

const CURRENCIES = ["USD", "CDF"];

function fmt(total: number, currency: string) {
  return `${total.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} ${currency === "CDF" ? "FC" : currency}`;
}
function fmtDate(d: string | null) {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export function FinanceBrowser({ rows }: { rows: FeeSummaryRow[] }) {
  const [query, setQuery] = useState("");
  const [onlyPaid, setOnlyPaid] = useState(false);
  // Élève dont le formulaire de paiement est ouvert (un seul à la fois).
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (onlyPaid && r.count === 0) return false;
      if (!q) return true;
      return r.fullName.toLowerCase().includes(q) || r.className.toLowerCase().includes(q);
    });
  }, [rows, query, onlyPaid]);

  // Regroupe les élèves filtrés par classe, avec total payé par devise par classe.
  const groups = useMemo(() => {
    const map = new Map<string, { className: string; students: FeeSummaryRow[]; totals: Map<string, number> }>();
    for (const r of filtered) {
      const g = map.get(r.className) ?? { className: r.className, students: [], totals: new Map<string, number>() };
      g.students.push(r);
      for (const t of r.totals) g.totals.set(t.currency, (g.totals.get(t.currency) ?? 0) + t.total);
      map.set(r.className, g);
    }
    return [...map.values()]
      .map((g) => ({
        ...g,
        students: g.students.sort((a, b) => a.fullName.localeCompare(b.fullName)),
        totalLabel: [...g.totals.entries()].map(([c, v]) => fmt(v, c)).join(" + ") || "—",
      }))
      .sort((a, b) => a.className.localeCompare(b.className));
  }, [filtered]);

  return (
    <>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-3)", display: "flex" }}>
            <Icon name="search" size={15} />
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un élève ou une classe…"
            style={{ width: "100%", padding: "10px 12px 10px 36px", borderRadius: 10, border: "1px solid var(--border-strong)", background: "var(--surface)", fontSize: 13.5, color: "var(--ink)" }}
          />
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--ink-2)", cursor: "pointer" }}>
          <input type="checkbox" checked={onlyPaid} onChange={(e) => setOnlyPaid(e.target.checked)} />
          <T fr="Seulement ceux qui ont payé" en="Only those who paid" />
        </label>
      </div>

      {groups.length === 0 ? (
        <div className="ek-card" style={{ padding: 40, textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
          <T fr="Aucun élève." en="No student." />
        </div>
      ) : (
        groups.map((g) => (
          <div key={g.className} className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
            {/* En-tête de classe avec total payé de la classe */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 18px",
                background: "var(--brand-soft)",
                borderBottom: "1px solid var(--border)",
                flexWrap: "wrap",
              }}
            >
              <Icon name="users" size={16} stroke={2} />
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--brand-600)" }}>{g.className}</span>
              <span style={{ fontSize: 12, color: "var(--ink-3)" }}>
                {g.students.length} <T fr="élève(s)" en="student(s)" />
              </span>
              <span style={{ marginLeft: "auto", fontSize: 12.5, color: "var(--ink-2)" }}>
                <T fr="Total classe" en="Class total" /> : <strong style={{ color: "var(--ink)" }}>{g.totalLabel}</strong>
              </span>
            </div>

            <div className="ek-tablewrap">
              <div style={{ minWidth: 680 }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: GRID,
                    padding: "10px 18px",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--ink-3)",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    background: "var(--surface-2)",
                  }}
                >
                  <div><T fr="Élève" en="Student" /></div>
                  <div><T fr="Total payé" en="Total paid" /></div>
                  <div style={{ textAlign: "center" }}><T fr="Paiements" en="Payments" /></div>
                  <div><T fr="Dernier" en="Last" /></div>
                  <div style={{ textAlign: "right" }}><T fr="Action" en="Action" /></div>
                </div>
                {g.students.map((r) => (
                  <PayRow
                    key={r.studentId}
                    row={r}
                    open={openId === r.studentId}
                    onToggle={() => setOpenId((cur) => (cur === r.studentId ? null : r.studentId))}
                  />
                ))}
              </div>
            </div>
          </div>
        ))
      )}
    </>
  );
}

const GRID = "2.2fr 1.5fr 0.8fr 1.3fr 1.5fr";

function PayRow({ row, open, onToggle }: { row: FeeSummaryRow; open: boolean; onToggle: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [label, setLabel] = useState("");
  const [comment, setComment] = useState("");
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10));

  const submit = async () => {
    setError(null);
    setOkMsg(null);
    const amt = parseFloat(amount.replace(",", "."));
    if (!(amt > 0)) { setError("Entrez un montant valide."); return; }

    let receiptUrl: string | undefined;
    const file = fileRef.current?.files?.[0];
    if (file) {
      setUploading(true);
      try {
        const supabase = createClient();
        const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
        const path = `${row.studentId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("fee-receipts").upload(path, file, { upsert: false });
        if (upErr) { setUploading(false); setError("Échec de l'envoi du reçu."); return; }
        receiptUrl = supabase.storage.from("fee-receipts").getPublicUrl(path).data.publicUrl;
      } catch {
        setUploading(false); setError("Échec de l'envoi du reçu."); return;
      }
      setUploading(false);
    }

    startTransition(async () => {
      const res = await recordStudentPayment({
        studentId: row.studentId, amount: amt, currency, label, comment, receiptUrl, paidAt,
      });
      if (res.ok) {
        setOkMsg(`Paiement de ${fmt(amt, currency)} enregistré.`);
        setAmount(""); setLabel(""); setComment("");
        setPaidAt(new Date().toISOString().slice(0, 10));
        if (fileRef.current) fileRef.current.value = "";
        router.refresh();
      } else {
        setError(res.message);
      }
    });
  };

  return (
    <div style={{ borderTop: "1px solid var(--divider)" }}>
      <div
        onClick={onToggle}
        style={{
          display: "grid",
          gridTemplateColumns: GRID,
          padding: "11px 18px",
          alignItems: "center",
          fontSize: 12.5,
          cursor: "pointer",
          background: open ? "var(--surface-2)" : "transparent",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
          <span style={{ fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.fullName}</span>
          <SexBadge sex={row.sex} size={16} />
        </div>
        <div style={{ color: row.count > 0 ? "var(--ink)" : "var(--ink-3)", fontWeight: 600 }}>
          {row.totals.length > 0 ? row.totals.map((t) => fmt(t.total, t.currency)).join(" + ") : "—"}
        </div>
        <div style={{ textAlign: "center", color: "var(--ink-2)" }}>{row.count || "—"}</div>
        <div style={{ color: "var(--ink-3)" }}>{fmtDate(row.lastPaidAt)}</div>
        <div style={{ textAlign: "right" }}>
          <span className="ek-btn ek-btn-primary" style={{ height: 28, fontSize: 11.5, pointerEvents: "none", display: "inline-flex" }}>
            <Icon name={open ? "close" : "plus"} size={12} />
            {open ? <T fr="Fermer" en="Close" /> : <T fr="Paiement" en="Payment" />}
          </span>
        </div>
      </div>

      {open && (
        <div style={{ padding: "0 18px 16px", background: "var(--surface-2)" }}>
          <div style={{ padding: 14, borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 110 }}>
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
            {okMsg && <div style={{ color: "var(--accent)", fontSize: 12, fontWeight: 600 }}>✓ {okMsg}</div>}
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <button onClick={submit} disabled={pending || uploading} className="ek-btn ek-btn-primary" style={{ height: 36, fontSize: 13, opacity: pending || uploading ? 0.6 : 1 }}>
                {uploading ? "Envoi du reçu…" : pending ? "Enregistrement…" : <T fr="Enregistrer le paiement" en="Save payment" />}
              </button>
              <Link href={`/school/students/${row.studentId}`} className="ek-btn ek-btn-outline" style={{ height: 36, fontSize: 12.5 }}>
                <Icon name="file" size={13} /> <T fr="Fiche complète & historique" en="Full record & history" />
              </Link>
            </div>
          </div>
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
