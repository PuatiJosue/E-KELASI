"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { useLang, type Lang } from "@/lib/i18n";
import { setLangAction } from "@/lib/lang-actions";
import { getNotifPrefAction, setNotifPrefAction, type NotifPref } from "@/lib/notif-actions";

type Appearance = "auto" | "light" | "dark";

const APPEARANCE_KEY = "ek-appearance";

function applyAppearance(pref: Appearance) {
  if (typeof document === "undefined") return;
  const dark =
    pref === "dark" ||
    (pref === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
}

// Carte « Préférences » réutilisable sur toutes les consoles (prof, école, admin) :
// langue (cookie, global), apparence (thème clair/sombre/auto) et notifications.
export function PreferencesCard() {
  const lang = useLang();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [appearance, setAppearance] = useState<Appearance>("auto");
  const [notif, setNotif] = useState<NotifPref>("all");
  const [hydrated, setHydrated] = useState(false);

  // Lecture des préférences au montage : apparence en local, notifications en base.
  useEffect(() => {
    try {
      const a = localStorage.getItem(APPEARANCE_KEY) as Appearance | null;
      if (a === "auto" || a === "light" || a === "dark") setAppearance(a);
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
        desc={tr("Interface E-KELASI", "E-KELASI interface")}
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

      {/* Apparence */}
      <SettingRow
        icon="moon"
        label={tr("Apparence", "Appearance")}
        desc={tr("Thème de l'interface", "Interface theme")}
        last
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
