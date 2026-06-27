"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { T, useLang } from "@/lib/i18n";
import { LanguageToggle } from "@/components/LanguageToggle";
import { MobileMenuButton } from "@/components/Shell";
import { LogoutButton } from "@/components/LogoutButton";
import type { MySchool } from "@/lib/school-db";

const LABELS: Record<string, { fr: string; en: string }> = {
  overview: { fr: "Vue d'ensemble",     en: "Overview" },
  teachers: { fr: "Professeurs",        en: "Teachers" },
  students: { fr: "Annuaire des classes", en: "Class directory" },
  classes:  { fr: "Rapport global de l'école", en: "School report" },
  reports:  { fr: "Bulletins",          en: "Report cards" },
  branding: { fr: "Branding école",     en: "School branding" },
  settings: { fr: "Paramètres",         en: "Settings" },
};

// Intervalle de rafraîchissement automatique des données (server components).
const AUTO_REFRESH_MS = 60_000;

export function SchoolTopbar({ school }: { school: MySchool | null }) {
  const lang = useLang();
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const key = pathname.split("/").filter(Boolean)[1] ?? "overview";
  const label = LABELS[key] ?? LABELS.overview;

  const [pending, startTransition] = useTransition();
  const [auto, setAuto] = useState(true);

  const refresh = () => startTransition(() => router.refresh());

  // Actualisation automatique : recharge les données du serveur sans perdre
  // l'état de la page (désactivable via le bouton).
  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => router.refresh(), AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [auto, router]);

  return (
    <div
      style={{
        height: 56,
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        borderBottom: "1px solid var(--border)",
        background: "var(--surface)",
        flexShrink: 0,
      }}
    >
      <MobileMenuButton />
      <div className="ek-hide-mobile" style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 600 }}>
        {school?.name ?? "École"} <span style={{ color: "var(--ink-4)" }}>/</span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.01em" }}>
        <T fr={label.fr} en={label.en} />
      </div>
      <div style={{ flex: 1 }} />

      {/* Rafraîchir maintenant + bascule auto-actualisation */}
      <button
        type="button"
        onClick={refresh}
        title={auto ? "Actualiser maintenant (auto activé)" : "Actualiser maintenant"}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          height: 34, padding: "0 10px", borderRadius: 9,
          border: "1px solid var(--border)", background: "var(--surface)",
          color: auto ? "var(--brand-600)" : "var(--ink-2)", cursor: "pointer",
          fontSize: 12, fontWeight: 600,
        }}
      >
        <Icon name="refresh" size={15} style={pending ? { animation: "ek-spin 0.8s linear infinite" } : undefined} />
        <span className="ek-hide-mobile"><T fr="Actualiser" en="Refresh" /></span>
      </button>
      <button
        type="button"
        onClick={() => setAuto((a) => !a)}
        title={auto ? "Désactiver l'actualisation automatique" : "Activer l'actualisation automatique"}
        style={{
          width: 34, height: 34, borderRadius: 9,
          border: `1px solid ${auto ? "var(--brand)" : "var(--border)"}`,
          background: auto ? "var(--brand-soft)" : "var(--surface)",
          color: auto ? "var(--brand-600)" : "var(--ink-3)",
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}
      >
        <Icon name="clock" size={15} />
      </button>

      <LanguageToggle current={lang} />
      <button
        type="button"
        onClick={() => router.push("/school/announcements")}
        title="Annonces"
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          border: "1px solid var(--border)",
          background: "var(--surface)",
          color: "var(--ink-2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <Icon name="bell" size={16} />
      </button>
      <span className="ek-hide-mobile" style={{ display: "flex" }}>
        <LogoutButton label="Déconnexion" />
      </span>
    </div>
  );
}
