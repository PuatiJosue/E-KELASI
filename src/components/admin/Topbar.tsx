"use client";

import { usePathname, useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { T, useLang } from "@/lib/i18n";
import { LanguageToggle } from "@/components/LanguageToggle";
import { MobileMenuButton } from "@/components/Shell";

const LABELS: Record<string, { fr: string; en: string }> = {
  overview: { fr: "Vue d'ensemble",            en: "Overview" },
  schools:  { fr: "Écoles partenaires",        en: "Partner schools" },
  billing:  { fr: "Abonnements & paiements",   en: "Subscriptions & billing" },
  payments: { fr: "Paiements Mobile Money",    en: "Mobile Money payments" },
  support:  { fr: "Support & tickets",         en: "Support & tickets" },
  security: { fr: "Sécurité & journaux",       en: "Security & logs" },
  team:     { fr: "Équipe E-KELASI",           en: "E-KELASI team" },
  plans:    { fr: "Plans & tarifs",            en: "Plans & pricing" },
  settings: { fr: "Paramètres",                en: "Settings" },
};

export function AdminTopbar() {
  const router = useRouter();
  const lang = useLang();
  const pathname = usePathname() ?? "";
  const key = pathname.split("/").filter(Boolean)[0] ?? "overview";
  const label = LABELS[key] ?? LABELS.overview;

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
        <T fr="Plateforme" en="Platform" /> <span style={{ color: "var(--ink-4)" }}>/</span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.01em" }}>
        <T fr={label.fr} en={label.en} />
      </div>
      <div style={{ flex: 1 }} />
      <LanguageToggle current={lang} />
      <button
        type="button"
        className="ek-hide-mobile"
        onClick={() => {
          const ev = new KeyboardEvent("keydown", { key: "k", metaKey: true });
          window.dispatchEvent(ev);
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "7px 12px",
          borderRadius: 9,
          background: "var(--surface-2)",
          color: "var(--ink-3)",
          fontSize: 12.5,
          minWidth: 240,
          cursor: "pointer",
        }}
      >
        <Icon name="search" size={14} />
        <T fr="Rechercher école, parent, log…" en="Search school, parent, log…" />
        <span
          style={{
            marginLeft: "auto",
            fontSize: 10,
            padding: "1px 5px",
            borderRadius: 4,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--ink-3)",
          }}
        >
          ⌘K
        </span>
      </button>
      <button
        type="button"
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
          position: "relative",
          cursor: "pointer",
        }}
      >
        <Icon name="bell" size={16} />
        <span
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "var(--brand)",
            border: "2px solid var(--surface)",
          }}
        />
      </button>
      <button
        type="button"
        onClick={() => router.push("/schools")}
        className="ek-btn ek-btn-primary"
        style={{ height: 34, padding: "0 12px", fontSize: 12.5 }}
      >
        <Icon name="plus" size={14} stroke={2.5} />
        <span className="ek-hide-mobile">
          <T fr="Inviter une école" en="Invite a school" />
        </span>
      </button>
    </div>
  );
}
