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
        <defs>
          <linearGradient id="ek-logo-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#5468F0" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="9" fill="url(#ek-logo-grad)" />
        <path
          d="M10 8v16M10 16l7-8M10 16l8 8"
          stroke="#fff"
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
            letterSpacing: "-0.03em",
            color: "var(--ink)",
          }}
        >
          E-KLASS
        </span>
      )}
    </div>
  );
}
