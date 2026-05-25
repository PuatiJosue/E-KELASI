import type { ReactNode } from "react";
import { Icon } from "./Icon";
import { T } from "@/lib/i18n";

export function KPI({
  label,
  value,
  delta,
  trend,
  sub,
  accent = "var(--ink)",
}: {
  label: ReactNode;
  value: ReactNode;
  delta?: string;
  trend?: ReactNode;
  sub?: ReactNode;
  accent?: string;
}) {
  const up = (delta || "").startsWith("+");
  return (
    <div className="ek-card" style={{ padding: 18, minWidth: 0 }}>
      <div style={{ fontSize: 11.5, color: "var(--ink-3)", fontWeight: 600, letterSpacing: "0.03em" }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 6 }}>
        <span
          style={{
            fontSize: 28,
            fontWeight: 700,
            fontFamily: "var(--font-display)",
            letterSpacing: "-0.025em",
            color: accent,
          }}
        >
          {value}
        </span>
        {delta && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: up ? "var(--accent)" : "var(--danger)",
              display: "inline-flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Icon name={up ? "arrowUp" : "arrowDn"} size={11} stroke={3} />
            {delta}
          </span>
        )}
      </div>
      {trend && <div style={{ marginTop: 8 }}>{trend}</div>}
      {sub && <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

export function PageHeader({
  title,
  sub,
  right,
}: {
  title: { fr: string; en: string };
  sub?: { fr: string; en: string };
  right?: ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
      <div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
            fontFamily: "var(--font-display)",
            color: "var(--ink)",
            letterSpacing: "-0.025em",
          }}
        >
          <T fr={title.fr} en={title.en} />
        </div>
        {sub && (
          <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 4 }}>
            <T fr={sub.fr} en={sub.en} />
          </div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>{right}</div>
    </div>
  );
}
