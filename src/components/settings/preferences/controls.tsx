"use client";

// Contrôles de présentation de la carte Préférences.

import { Icon } from "@/components/Icon";

export function SettingRow({
  icon,
  label,
  desc,
  children,
  last,
}: {
  icon: string;
  label: string;
  desc: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 0",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: "var(--surface-2)",
          color: "var(--ink-2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon name={icon} size={16} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>{label}</div>
        <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>{desc}</div>
      </div>
      {children}
    </div>
  );
}

export function Divider() {
  return <div style={{ height: 1, background: "var(--divider)" }} />;
}

export function Segmented({
  options,
  value,
  onChange,
  disabled,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 2,
        padding: 2,
        borderRadius: 8,
        background: "var(--surface-2)",
        opacity: disabled ? 0.6 : 1,
        flexShrink: 0,
      }}
    >
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            disabled={disabled}
            style={{
              padding: "5px 11px",
              borderRadius: 6,
              background: on ? "var(--surface)" : "transparent",
              color: on ? "var(--ink)" : "var(--ink-3)",
              fontSize: 11.5,
              fontWeight: 700,
              letterSpacing: "0.02em",
              cursor: disabled ? "default" : "pointer",
              boxShadow: on ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
              whiteSpace: "nowrap",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

