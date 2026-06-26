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
              <div style={{ minWidth: 640 }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2.4fr 1.6fr 0.8fr 1.4fr",
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
                </div>
                {g.students.map((r, i) => (
                  <Link
                    key={r.studentId}
                    href={`/school/students/${r.studentId}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2.4fr 1.6fr 0.8fr 1.4fr",
                      padding: "11px 18px",
                      alignItems: "center",
                      fontSize: 12.5,
                      borderTop: "1px solid var(--divider)",
                    }}
                  >
                    <div style={{ fontWeight: 600, color: "var(--ink)" }}>{r.fullName}</div>
                    <div style={{ color: r.count > 0 ? "var(--ink)" : "var(--ink-3)", fontWeight: 600 }}>
                      {r.totals.length > 0 ? r.totals.map((t) => fmt(t.total, t.currency)).join(" + ") : "—"}
                    </div>
                    <div style={{ textAlign: "center", color: "var(--ink-2)" }}>{r.count || "—"}</div>
                    <div style={{ color: "var(--ink-3)" }}>{fmtDate(r.lastPaidAt)}</div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ))
      )}
    </>
  );
}
