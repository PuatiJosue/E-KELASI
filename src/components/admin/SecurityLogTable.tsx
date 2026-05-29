"use client";

import { useState } from "react";
import { T } from "@/lib/i18n";
import type { LogEvent } from "@/lib/mock";

const SEV_COLOR: Record<string, string> = {
  info: "var(--info)",
  warn: "var(--warning)",
  critical: "var(--danger)",
};

const TABS = ["all", "info", "warn", "critical"] as const;
type Tab = (typeof TABS)[number];

const TAB_LABEL: Record<Tab, { fr: string; en: string }> = {
  all:      { fr: "Tous",     en: "All" },
  info:     { fr: "Info",     en: "Info" },
  warn:     { fr: "Warn",     en: "Warn" },
  critical: { fr: "Critical", en: "Critical" },
};

export function SecurityLogTable({ events }: { events: LogEvent[] }) {
  const [tab, setTab] = useState<Tab>("all");
  const filtered = tab === "all" ? events : events.filter((e) => e.sev === tab);

  return (
    <div className="ek-card" style={{ padding: 0, overflow: "hidden" }}>
      <div
        style={{
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          borderBottom: "1px solid var(--divider)",
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
          <T fr="Journal d'événements" en="Event log" />
        </div>
        <div style={{ flex: 1 }} />
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "4px 10px",
              borderRadius: 6,
              background: tab === t ? "var(--surface-2)" : "transparent",
              color: tab === t ? "var(--ink)" : "var(--ink-3)",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <T fr={TAB_LABEL[t].fr} en={TAB_LABEL[t].en} />
          </button>
        ))}
      </div>
      <div className="ek-tablewrap" style={{ fontFamily: "var(--font-mono)", fontSize: 11.5 }}>
        <div style={{ minWidth: 640 }}>
        {filtered.length === 0 && (
          <div
            style={{
              padding: 24,
              textAlign: "center",
              color: "var(--ink-3)",
              fontSize: 12,
              fontFamily: "var(--font-body)",
            }}
          >
            <T fr="Aucun événement pour ce filtre." en="No events for this filter." />
          </div>
        )}
        {filtered.map((e, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "80px 80px 130px 80px 1fr",
              padding: "10px 18px",
              alignItems: "center",
              gap: 12,
              borderBottom: i < filtered.length - 1 ? "1px solid var(--divider)" : "none",
              color: "var(--ink-2)",
            }}
          >
            <span style={{ color: "var(--ink-3)" }}>{e.ts}</span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: SEV_COLOR[e.sev],
                background: SEV_COLOR[e.sev] + "18",
                padding: "2px 6px",
                borderRadius: 4,
                textTransform: "uppercase",
                textAlign: "center",
                fontFamily: "var(--font-body)",
                letterSpacing: "0.04em",
              }}
            >
              {e.sev}
            </span>
            <span style={{ color: "var(--brand-600)" }}>{e.actor}</span>
            <span
              style={{
                color: "var(--ink-3)",
                fontSize: 10.5,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                fontFamily: "var(--font-body)",
                fontWeight: 600,
              }}
            >
              {e.src}
            </span>
            <span style={{ color: "var(--ink)", fontFamily: "var(--font-body)", fontSize: 12.5 }}>
              <T fr={e.msg.fr} en={e.msg.en} />
            </span>
          </div>
        ))}
        </div>
      </div>
    </div>
  );
}
