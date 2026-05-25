"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";

type Tweaks = {
  primaryColor: string;
  dark: boolean;
  cardStyle: "default" | "flat" | "elevated" | "outlined";
  font: "bricolage" | "editorial" | "geometric" | "jakarta";
};

const DEFAULTS: Tweaks = {
  primaryColor: "#E0701E",
  dark: false,
  cardStyle: "default",
  font: "bricolage",
};

const COLORS = ["#E0701E", "#1D6650", "#3A6DBC", "#9747BB", "#B8475B"];
const CARD_STYLES: Array<{ value: Tweaks["cardStyle"]; label: string }> = [
  { value: "default",  label: "Défaut" },
  { value: "flat",     label: "Plat" },
  { value: "elevated", label: "Ombré" },
  { value: "outlined", label: "Bordé" },
];
const FONTS: Array<{ value: Tweaks["font"]; label: string }> = [
  { value: "bricolage",  label: "Bricolage (warm)" },
  { value: "editorial",  label: "Editorial serif" },
  { value: "geometric",  label: "Geist geometric" },
  { value: "jakarta",    label: "Jakarta clean" },
];

const STORAGE_KEY = "ek-tweaks-v1";

function hexToRgb(hex: string) {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

function mixHex(a: string, b: string, t: number) {
  const ra = hexToRgb(a);
  const rb = hexToRgb(b);
  if (!ra || !rb) return a;
  const mix = (k1: number, k2: number) =>
    Math.round(k1 * (1 - t) + k2 * t).toString(16).padStart(2, "0");
  return "#" + mix(ra.r, rb.r) + mix(ra.g, rb.g) + mix(ra.b, rb.b);
}

function applyTweaks(t: Tweaks) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--brand", t.primaryColor);
  const c = hexToRgb(t.primaryColor);
  if (c) {
    root.style.setProperty("--brand-soft", `rgba(${c.r},${c.g},${c.b},0.10)`);
    root.style.setProperty("--brand-600", mixHex(t.primaryColor, "#000000", 0.25));
    root.style.setProperty("--brand-700", mixHex(t.primaryColor, "#000000", 0.45));
    root.style.setProperty("--brand-100", mixHex(t.primaryColor, "#ffffff", 0.75));
    root.style.setProperty("--brand-50",  mixHex(t.primaryColor, "#ffffff", 0.92));
  }
  root.setAttribute("data-theme", t.dark ? "dark" : "light");
  root.setAttribute("data-card-style", t.cardStyle);
  root.setAttribute("data-font", t.font);
}

export function TweaksPanel() {
  const [open, setOpen] = useState(false);
  const [t, setT] = useState<Tweaks>(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = { ...DEFAULTS, ...JSON.parse(raw) };
        setT(parsed);
        applyTweaks(parsed);
      } else {
        applyTweaks(DEFAULTS);
      }
    } catch {
      applyTweaks(DEFAULTS);
    }
    setHydrated(true);
  }, []);

  const update = <K extends keyof Tweaks>(key: K, value: Tweaks[K]) => {
    setT((prev) => {
      const next = { ...prev, [key]: value };
      applyTweaks(next);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const reset = () => {
    setT(DEFAULTS);
    applyTweaks(DEFAULTS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  if (!hydrated) return null;

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Tweaks"
        style={{
          position: "fixed",
          bottom: 18,
          right: 18,
          width: 42,
          height: 42,
          borderRadius: "50%",
          background: "var(--ink)",
          color: "var(--surface)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
          zIndex: 80,
          cursor: "pointer",
        }}
      >
        <Icon name="settings" size={18} />
      </button>

      {open && (
        <div
          className="ek-card"
          style={{
            position: "fixed",
            bottom: 70,
            right: 18,
            width: 280,
            padding: 16,
            zIndex: 80,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>Tweaks</div>
            <button
              onClick={reset}
              style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600 }}
              title="Réinitialiser"
            >
              Reset
            </button>
          </div>

          <Section label="Marque">
            <Row label="Primary">
              <div style={{ display: "flex", gap: 6 }}>
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => update("primaryColor", c)}
                    aria-label={c}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: c,
                      border:
                        t.primaryColor === c
                          ? "2px solid var(--ink)"
                          : "2px solid transparent",
                      cursor: "pointer",
                    }}
                  />
                ))}
              </div>
            </Row>
            <Row label="Font">
              <select
                value={t.font}
                onChange={(e) => update("font", e.target.value as Tweaks["font"])}
                style={selectStyle}
              >
                {FONTS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </Row>
          </Section>

          <Section label="Apparence">
            <Row label="Mode sombre">
              <Toggle on={t.dark} onChange={(v) => update("dark", v)} />
            </Row>
            <Row label="Style cartes">
              <select
                value={t.cardStyle}
                onChange={(e) => update("cardStyle", e.target.value as Tweaks["cardStyle"])}
                style={selectStyle}
              >
                {CARD_STYLES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Row>
          </Section>
        </div>
      )}
    </>
  );
}

const selectStyle: React.CSSProperties = {
  padding: "4px 8px",
  borderRadius: 6,
  border: "1px solid var(--border-strong)",
  background: "var(--surface)",
  color: "var(--ink)",
  fontSize: 11.5,
  fontFamily: "inherit",
  cursor: "pointer",
};

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: "var(--ink-3)",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{children}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
      <span style={{ fontSize: 12, color: "var(--ink-2)" }}>{label}</span>
      {children}
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      aria-pressed={on}
      style={{
        width: 36,
        height: 20,
        borderRadius: 10,
        background: on ? "var(--brand)" : "var(--surface-3)",
        position: "relative",
        cursor: "pointer",
        transition: "background .15s",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: on ? 18 : 2,
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "#fff",
          transition: "left .15s",
          boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
        }}
      />
    </button>
  );
}
