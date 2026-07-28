"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { useLang, type Lang } from "@/lib/i18n";
import { setLangAction } from "@/lib/lang-actions";
import { getNotifPrefAction, setNotifPrefAction, type NotifPref } from "@/lib/notif-actions";
import {
  APPEARANCE_KEY, COLOR_KEY, FONT_KEY, CARDSTYLE_KEY, DEFAULT_COLOR, COLORS, FONTS, CARD_STYLES,
  applyAppearance, applyColor, applyFont, applyCardStyle,
  type Appearance, type Font, type CardStyle,
} from "./preferences/theme";
import { SettingRow, Divider, Segmented } from "./preferences/controls";

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

