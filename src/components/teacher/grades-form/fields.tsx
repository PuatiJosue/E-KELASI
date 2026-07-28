"use client";

// Champs de saisie réutilisables du formulaire de notes.

import { Icon } from "@/components/Icon";

export function Selector({
  label,
  value,
  onChange,
  options,
}: {
  label: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: "9px 10px",
          borderRadius: 8,
          border: "1px solid var(--border-strong)",
          background: "var(--surface)",
          color: "var(--ink)",
          fontSize: 13,
          fontFamily: "inherit",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ComboField({
  label,
  value,
  onChange,
  suggestions,
  listId,
  placeholder,
}: {
  label: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  suggestions: string[];
  listId: string;
  placeholder?: string;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        list={listId}
        placeholder={placeholder}
        autoComplete="off"
        style={{
          padding: "9px 10px",
          borderRadius: 8,
          border: "1px solid var(--border-strong)",
          background: "var(--surface)",
          color: "var(--ink)",
          fontSize: 13,
          fontFamily: "inherit",
        }}
      />
      <datalist id={listId}>
        {suggestions.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </label>
  );
}

export function TextField({
  label,
  value,
  onChange,
  type = "text",
  ...rest
}: {
  label: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  type?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</span>
      <input
        {...rest}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: "9px 10px",
          borderRadius: 8,
          border: "1px solid var(--border-strong)",
          background: "var(--surface)",
          color: "var(--ink)",
          fontSize: 13,
          fontFamily: "inherit",
        }}
      />
    </label>
  );
}

