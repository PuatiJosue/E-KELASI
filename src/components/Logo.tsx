import type { CSSProperties } from "react";

export function Logo({
  size = 28,
  withWord = false,
  style,
}: {
  size?: number;
  withWord?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, ...style }}>
      <svg width={size} height={size} viewBox="0 0 32 32">
        <rect width="32" height="32" rx="9" fill="var(--brand)" />
        <path
          d="M10 8v16M10 16l7-8M10 16l8 8"
          stroke="white"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      {withWord && (
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: size * 0.7,
            fontWeight: 700,
            color: "var(--ink)",
            letterSpacing: "-0.03em",
          }}
        >
          E-KELASI
        </span>
      )}
    </div>
  );
}
