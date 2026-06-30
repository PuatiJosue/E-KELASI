import type { ReactNode } from "react";
import { Icon } from "./Icon";
import { T } from "@/lib/i18n";

export type KpiTint = "blue" | "violet" | "green" | "amber" | "rose" | "teal";

export function KPI({
  label,
  value,
  delta,
  trend,
  sub,
  icon,
  tint = "blue",
  accent,
}: {
  label: ReactNode;
  value: ReactNode;
  delta?: string;
  trend?: ReactNode;
  sub?: ReactNode;
  icon?: string;
  tint?: KpiTint;
  accent?: string;
}) {
  const up = (delta || "").startsWith("+");
  return (
    <div className="ek-card" style={{ padding: 18, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
          {label}
        </div>
        {icon && (
          <span className={`ek-tint ${tint}`}>
            <Icon name={icon} size={18} stroke={1.9} />
          </span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 10 }}>
        <span
          style={{
            fontSize: 30,
            fontWeight: 700,
            fontFamily: "var(--font-display)",
            letterSpacing: "-0.03em",
            color: accent ?? "var(--ink)",
          }}
        >
          {value}
        </span>
        {delta && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: up ? "var(--success)" : "var(--danger)",
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
      {sub && <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>{sub}</div>}
      {trend && <div style={{ marginTop: 8 }}>{trend}</div>}
    </div>
  );
}

/** Ligne de tendance « ↗ +2 ce mois » (verte) / « ↘ … » (rouge) sous un KPI. */
export function Trend({ up = true, children }: { up?: boolean; children: ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 12,
        fontWeight: 600,
        color: up ? "var(--success)" : "var(--danger)",
      }}
    >
      <Icon name={up ? "arrowUp" : "arrowDn"} size={12} stroke={2.6} />
      {children}
    </span>
  );
}

export function PageHeader({
  title,
  sub,
  right,
  eyebrow,
  highlight,
}: {
  title: { fr: string; en: string };
  sub?: { fr: string; en: string };
  right?: ReactNode;
  /** Petite pastille au-dessus du titre (ex. « Année scolaire 2025–2026 »). */
  eyebrow?: { fr: string; en: string };
  /** Mot/segment du titre à colorer en bleu (ex. le nom de l'école). */
  highlight?: string;
}) {
  const renderTitle = (txt: string) => {
    if (!highlight || !txt.includes(highlight)) return txt;
    const [before, ...rest] = txt.split(highlight);
    const after = rest.join(highlight);
    return (
      <>
        {before}
        <span style={{ color: "var(--brand)" }}>{highlight}</span>
        {after}
      </>
    );
  };

  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
      <div>
        {eyebrow && (
          <span
            className="ek-chip"
            style={{ marginBottom: 12, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--ink-2)" }}
          >
            <span style={{ width: 7, height: 7, borderRadius: 999, background: "var(--success)", display: "inline-block" }} />
            <T fr={eyebrow.fr} en={eyebrow.en} />
          </span>
        )}
        <h1
          style={{
            fontSize: 30,
            fontWeight: 700,
            fontFamily: "var(--font-display)",
            color: "var(--ink)",
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
          }}
        >
          <T fr={renderTitle(title.fr)} en={renderTitle(title.en)} />
        </h1>
        {sub && (
          <div style={{ fontSize: 13.5, color: "var(--ink-3)", marginTop: 8 }}>
            <T fr={sub.fr} en={sub.en} />
          </div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>{right}</div>
    </div>
  );
}
