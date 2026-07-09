"use client";

import { useState, useRef, useEffect } from "react";
import { Icon } from "@/components/Icon";
import type { FinanceAlert, AlertSeverity } from "@/lib/finance/alerts";

const SEV: Record<AlertSeverity, { dot: string; label: string }> = {
  critical: { dot: "#E11D48", label: "Critique" },
  warning: { dot: "#D97706", label: "Attention" },
  info: { dot: "#4F66E8", label: "Info" },
};

export function AlertsBell({ alerts }: { alerts: FinanceAlert[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const actionable = alerts.filter((a) => a.severity !== "info").length;

  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen((o) => !o)} title="Alertes"
        style={{ position: "relative", width: 40, height: 40, borderRadius: 9, border: "1px solid var(--border-strong)", background: "var(--surface)", cursor: "pointer", color: "var(--ink-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name="bell" size={17} />
        {actionable > 0 && (
          <span style={{ position: "absolute", top: -5, right: -5, minWidth: 17, height: 17, padding: "0 4px", borderRadius: 999, background: "#E11D48", color: "#fff", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{actionable}</span>
        )}
      </button>
      {open && (
        <div style={{ position: "absolute", top: 46, right: 0, width: 340, maxHeight: 420, overflowY: "auto", zIndex: 100, background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: 12, boxShadow: "0 12px 32px rgba(20,16,10,0.18)" }}>
          <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--divider)", fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>Alertes ({alerts.length})</div>
          {alerts.length === 0 ? (
            <div style={{ padding: 22, textAlign: "center", color: "var(--ink-3)", fontSize: 12.5 }}>Aucune alerte. Tout est à jour.</div>
          ) : alerts.map((a, i) => (
            <div key={a.id} style={{ display: "flex", gap: 10, padding: "10px 14px", borderTop: i > 0 ? "1px solid var(--divider)" : "none" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: SEV[a.severity].dot, marginTop: 5, flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink)" }}>{a.title}</div>
                <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 1 }}>{a.detail}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
