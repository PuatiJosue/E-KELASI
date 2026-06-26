"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { useLang, type Lang } from "@/lib/i18n";
import { setLangAction } from "@/lib/lang-actions";
import { getNotifPrefAction, setNotifPrefAction, type NotifPref } from "@/lib/notif-actions";

type Appearance = "auto" | "light" | "dark";
type Font = "bricolage" | "editorial" | "geometric" | "jakarta";
type CardStyle = "default" | "flat" | "elevated" | "outlined";

const APPEARANCE_KEY = "ek-appearance";
const COLOR_KEY = "ek-color";
const FONT_KEY = "ek-font";
const CARDSTYLE_KEY = "ek-cardstyle";

const DEFAULT_COLOR = "#1E2F6D";
const COLORS = ["#1E2F6D", "#E0701E", "#1D6650", "#3A6DBC", "#9747BB", "#B8475B"];
const FONTS: { value: Font; label: string }[] = [
  { value: "bricolage", label: "Bricolage" },
  { value: "editorial", label: "Editorial" },
  { value: "geometric", label: "Geometric" },
  { value: "jakarta", label: "Jakarta" },
];
const CARD_STYLES: { value: CardStyle; labelFr: string; labelEn: string }[] = [
  { value: "default", labelFr: "Défaut", labelEn: "Default" },
  { value: "flat", labelFr: "Plat", labelEn: "Flat" },
  { value: "elevated", labelFr: "Ombré", labelEn: "Elevated" },
  { value: "outlined", labelFr: "Bordé", labelEn: "Outlined" },
];

function applyAppearance(pref: Appearance) {
  if (typeof document === "undefined") return;
  const dark =
    pref === "dark" ||
    (pref === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
}

function hexToRgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}
function mixHex(a: string, b: string, t: number) {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  const p = (v: number) => Math.round(v).toString(16).padStart(2, "0");
  return "#" + p(x[0] * (1 - t) + y[0] * t) + p(x[1] * (1 - t) + y[1] * t) + p(x[2] * (1 - t) + y[2] * t);
}
function applyColor(hex: string) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const [r, g, b] = hexToRgb(hex);
  root.style.setProperty("--brand", hex);
  root.style.setProperty("--brand-soft", `rgba(${r},${g},${b},0.10)`);
  root.style.setProperty("--brand-600", mixHex(hex, "#000000", 0.25));
  root.style.setProperty("--brand-700", mixHex(hex, "#000000", 0.45));
  root.style.setProperty("--brand-100", mixHex(hex, "#ffffff", 0.75));
  root.style.setProperty("--brand-50", mixHex(hex, "#ffffff", 0.92));
}
function applyFont(font: Font) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-font", font);
}
function applyCardStyle(style: CardStyle) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-card-style", style);
}

// Carte « Préférences » réutilisable sur toutes les consoles (prof, école, admin) :
// langue (cookie, global), apparence (thème clair/sombre/auto) et notifications.
export function PreferencesCard() {
  const lang = useLang();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [appearance, setAppearance] = useState<Appearance>("auto");
  const [color, setColor] = useState<string>(DEFAULT_COLOR);
  const [font, setFont] = useState<Font>("bricolage");
  const [cardStyle, setCardStyle] = useState<CardStyle>("default");
  const [notif, setNotif] = useState<NotifPref>("all");
  const [hydrated, setHydrated] = useState(false);

  // Lecture des préférences au montage : apparence en local, notifications en base.
  useEffect(() => {
    try {
      const a = localStorage.getItem(APPEARANCE_KEY) as Appearance | null;
      if (a === "auto" || a === "light" || a === "dark") setAppearance(a);
      const c = localStorage.getItem(COLOR_KEY);
      if (c && /^#[0-9a-fA-F]{6}$/.test(c)) setColor(c);
      const f = localStorage.getItem(FONT_KEY) as Font | null;
      if (f && FONTS.some((x) => x.value === f)) setFont(f);
      const cs = localStorage.getItem(CARDSTYLE_KEY) as CardStyle | null;
      if (cs && CARD_STYLES.some((x) => x.value === cs)) setCardStyle(cs);
    } catch {}
    setHydrated(true);
    getNotifPrefAction().then(setNotif).catch(() => {});
  }, []);

  // En mode auto, suit les changements de thème système en direct.
  useEffect(() => {
    if (appearance !== "auto") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyAppearance("auto");
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, [appearance]);

  const setLang = (l: Lang) => {
    if (l === lang) return;
    startTransition(async () => {
      await setLangAction(l);
      router.refresh();
    });
  };

  const chooseAppearance = (a: Appearance) => {
    setAppearance(a);
    try { localStorage.setItem(APPEARANCE_KEY, a); } catch {}
    applyAppearance(a);
  };

  const chooseNotif = (n: NotifPref) => {
    setNotif(n); // optimiste
    startTransition(async () => {
      await setNotifPrefAction(n);
    });
  };

  const chooseColor = (c: string) => {
    setColor(c);
    try { localStorage.setItem(COLOR_KEY, c); } catch {}
    applyColor(c);
  };
  const chooseFont = (f: Font) => {
    setFont(f);
    try { localStorage.setItem(FONT_KEY, f); } catch {}
    applyFont(f);
  };
  const chooseCardStyle = (cs: CardStyle) => {
    setCardStyle(cs);
    try { localStorage.setItem(CARDSTYLE_KEY, cs); } catch {}
    applyCardStyle(cs);
  };

  const tr = (fr: string, en: string) => (lang === "en" ? en : fr);

  return (
    <div className="ek-card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 6 }}>
      {/* Notifications */}
      <SettingRow
        icon="bell"
        label={tr("Notifications", "Notifications")}
        desc={tr("À la création de devoirs / notes", "When homework / grades are created")}
      >
        <Segmented
          options={[
            { value: "all", label: tr("Tout", "All") },
            { value: "important", label: tr("Important", "Important") },
            { value: "none", label: tr("Aucune", "None") },
          ]}
          value={notif}
          onChange={(v) => chooseNotif(v as NotifPref)}
        />
      </SettingRow>

      <Divider />

      {/* Langue */}
      <SettingRow
        icon="mail"
        label={tr("Langue", "Language")}
        desc={tr("Interface E-KLASS", "E-KLASS interface")}
      >
        <Segmented
          options={[
            { value: "fr", label: "FR" },
            { value: "en", label: "EN" },
          ]}
          value={lang}
          onChange={(v) => setLang(v as Lang)}
          disabled={pending}
        />
      </SettingRow>

      <Divider />

      {/* Apparence (thème) */}
      <SettingRow
        icon="moon"
        label={tr("Apparence", "Appearance")}
        desc={tr("Thème de l'interface", "Interface theme")}
      >
        <Segmented
          options={[
            { value: "auto", label: tr("Auto", "Auto") },
            { value: "light", label: tr("Clair", "Light") },
            { value: "dark", label: tr("Sombre", "Dark") },
          ]}
          value={hydrated ? appearance : "auto"}
          onChange={(v) => chooseAppearance(v as Appearance)}
        />
      </SettingRow>

      <Divider />

      {/* Couleur principale */}
      <SettingRow
        icon="star"
        label={tr("Couleur", "Color")}
        desc={tr("Couleur principale de l'interface", "Primary interface color")}
      >
        <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
          {COLORS.map((c) => {
            const on = hydrated && color.toLowerCase() === c.toLowerCase();
            return (
              <button
                key={c}
                onClick={() => chooseColor(c)}
                aria-label={c}
                style={{
                  width: 22, height: 22, borderRadius: "50%", background: c,
                  border: on ? "2px solid var(--ink)" : "2px solid transparent",
                  cursor: "pointer", flexShrink: 0,
                }}
              />
            );
          })}
          <input
            type="color"
            value={hydrated ? color : DEFAULT_COLOR}
            onChange={(e) => chooseColor(e.target.value)}
            aria-label={tr("Couleur personnalisée", "Custom color")}
            style={{ width: 26, height: 26, padding: 0, border: "1px solid var(--border-strong)", borderRadius: 6, cursor: "pointer", background: "none" }}
          />
        </div>
      </SettingRow>

      <Divider />

      {/* Police */}
      <SettingRow
        icon="file"
        label={tr("Police", "Font")}
        desc={tr("Style typographique", "Typography style")}
      >
        <Segmented
          options={FONTS.map((f) => ({ value: f.value, label: f.label }))}
          value={hydrated ? font : "bricolage"}
          onChange={(v) => chooseFont(v as Font)}
        />
      </SettingRow>

      <Divider />

      {/* Style des cartes */}
      <SettingRow
        icon="settings"
        label={tr("Style des cartes", "Card style")}
        desc={tr("Aspect des panneaux", "Panel appearance")}
        last
      >
        <Segmented
          options={CARD_STYLES.map((s) => ({ value: s.value, label: tr(s.labelFr, s.labelEn) }))}
          value={hydrated ? cardStyle : "default"}
          onChange={(v) => chooseCardStyle(v as CardStyle)}
        />
      </SettingRow>
    </div>
  );
}

function SettingRow({
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

function Divider() {
  return <div style={{ height: 1, background: "var(--divider)" }} />;
}

function Segmented({
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
