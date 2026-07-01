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
  videos:   { fr: "Vidéos E-KLASS",             en: "E-KLASS videos" },
  team:           { fr: "Équipe E-KLASS",           en: "E-KLASS team" },
  plans:          { fr: "Plans & tarifs",            en: "Plans & pricing" },
  "year-archive": { fr: "Archive annuelle",          en: "Year archive" },
  settings:       { fr: "Paramètres",                en: "Settings" },
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
        height: 60,
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
      <div className="ek-hide-mobile" style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: 13, color: "var(--ink-2)", fontWeight: 700 }}><T fr="Plateforme" en="Platform" /></span>
        <Icon name="chevR" size={13} color="var(--ink-4)" />
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-3)" }}>
          <T fr={label.fr} en={label.en} />
        </span>
      </div>

      <div style={{ flex: 1, display: "flex", justifyContent: "center", minWidth: 0 }}>
        <button
          type="button"
          className="ek-search ek-hide-mobile"
          onClick={() => {
            const ev = new KeyboardEvent("keydown", { key: "k", metaKey: true });
            window.dispatchEvent(ev);
          }}
          style={{ width: "100%", maxWidth: 440, cursor: "pointer", textAlign: "left" }}
        >
          <Icon name="search" size={16} color="var(--ink-3)" />
          <span style={{ flex: 1, fontSize: 13, color: "var(--ink-3)" }}>
            <T fr="Rechercher école, parent, log…" en="Search school, parent, log…" />
          </span>
          <kbd
            style={{
              fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono)",
              border: "1px solid var(--border)", borderRadius: 6, padding: "1px 6px", background: "var(--surface-2)",
            }}
          >
            ⌘K
          </kbd>
        </button>
      </div>

      <LanguageToggle current={lang} />
      <button
        type="button"
        onClick={() => router.push("/broadcast")}
        title="Diffusion"
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
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
            background: "var(--danger)",
            border: "2px solid var(--surface)",
          }}
        />
      </button>
      <button
        type="button"
        onClick={() => router.push("/schools")}
        className="ek-btn ek-btn-primary"
        style={{ height: 36, padding: "0 14px", fontSize: 13 }}
      >
        <Icon name="plus" size={14} stroke={2.5} />
        <span className="ek-hide-mobile">
          <T fr="Inviter une école" en="Invite a school" />
        </span>
      </button>
    </div>
  );
}
