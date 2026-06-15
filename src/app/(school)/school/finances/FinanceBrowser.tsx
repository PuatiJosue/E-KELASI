"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { T } from "@/lib/i18n";
import type { FeeSummaryRow } from "@/lib/finance-db";

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (onlyPaid && r.count === 0) return false;
      if (!q) return true;
      return r.fullName.toLowerCase().includes(q) || r.className.toLowerCase().includes(q);
    });
  }, [rows, query, onlyPaid]);

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

      <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="ek-tablewrap">
          <div style={{ minWidth: 720 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1.2fr 1.3fr 0.8fr 1.2fr",
                padding: "12px 18px",
                fontSize: 11,
                fontWeight: 700,
                color: "var(--ink-3)",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                background: "var(--surface-2)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div><T fr="Élève" en="Student" /></div>
              <div><T fr="Classe" en="Class" /></div>
              <div><T fr="Total payé" en="Total paid" /></div>
              <div style={{ textAlign: "center" }}><T fr="Paiements" en="Payments" /></div>
              <div><T fr="Dernier" en="Last" /></div>
            </div>
            {filtered.map((r, i) => (
              <Link
                key={r.studentId}
                href={`/school/students/${r.studentId}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1.2fr 1.3fr 0.8fr 1.2fr",
                  padding: "12px 18px",
                  alignItems: "center",
                  fontSize: 12.5,
                  borderTop: i > 0 ? "1px solid var(--divider)" : "none",
                }}
              >
                <div style={{ fontWeight: 600, color: "var(--ink)" }}>{r.fullName}</div>
                <div style={{ color: "var(--ink-3)" }}>{r.className}</div>
                <div style={{ color: r.count > 0 ? "var(--ink)" : "var(--ink-3)", fontWeight: 600 }}>
                  {r.totals.length > 0 ? r.totals.map((t) => fmt(t.total, t.currency)).join(" + ") : "—"}
                </div>
                <div style={{ textAlign: "center", color: "var(--ink-2)" }}>{r.count || "—"}</div>
                <div style={{ color: "var(--ink-3)" }}>{fmtDate(r.lastPaidAt)}</div>
              </Link>
            ))}
            {filtered.length === 0 && (
              <div style={{ padding: 40, textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
                <T fr="Aucun élève." en="No student." />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
