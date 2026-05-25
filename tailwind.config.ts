import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "var(--brand)",
          50: "var(--brand-50)",
          100: "var(--brand-100)",
          600: "var(--brand-600)",
          700: "var(--brand-700)",
          soft: "var(--brand-soft)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          50: "var(--accent-50)",
          100: "var(--accent-100)",
        },
        ink: {
          DEFAULT: "var(--ink)",
          2: "var(--ink-2)",
          3: "var(--ink-3)",
          4: "var(--ink-4)",
        },
        surface: {
          DEFAULT: "var(--surface)",
          2: "var(--surface-2)",
          3: "var(--surface-3)",
        },
        bg: "var(--bg)",
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
        divider: "var(--divider)",
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
        info: "var(--info)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: {
        sm: "var(--r-sm)",
        md: "var(--r-md)",
        lg: "var(--r-lg)",
        xl: "var(--r-xl)",
      },
    },
  },
  plugins: [],
};

export default config;
