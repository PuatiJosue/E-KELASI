"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";
import { Logo } from "@/components/Logo";
import { Avatar } from "@/components/Avatar";
import { LogoutButton } from "@/components/LogoutButton";
import { T } from "@/lib/i18n";

type NavItem = { id: string; href: string; icon: string; fr: string; en: string };

const NAV: NavItem[] = [
  { id: "overview", href: "/overview", icon: "pieChart",   fr: "Vue d'ensemble", en: "Overview" },
  { id: "schools",  href: "/schools",  icon: "school",     fr: "Écoles",         en: "Schools" },
  { id: "broadcast", href: "/broadcast", icon: "bell",      fr: "Diffusion",      en: "Broadcast" },
  { id: "billing",  href: "/billing",  icon: "creditcard", fr: "Abonnements",    en: "Subscriptions" },
  { id: "payments", href: "/payments", icon: "dollar",     fr: "Mobile Money",   en: "Mobile Money" },
  { id: "support",  href: "/support",  icon: "chat",       fr: "Support",        en: "Support" },
  { id: "security", href: "/security", icon: "shield",     fr: "Sécurité & logs", en: "Security & logs" },
];

const ORG: NavItem[] = [
  { id: "team",          href: "/team",          icon: "users",      fr: "Équipe E-KLASS", en: "E-KLASS team" },
  { id: "plans",         href: "/plans",         icon: "creditcard", fr: "Plans & prix",    en: "Plans & pricing" },
  { id: "year-archive",  href: "/year-archive",  icon: "refresh",    fr: "Archive annuelle", en: "Year archive" },
  { id: "settings",      href: "/settings",      icon: "settings",   fr: "Paramètres",      en: "Settings" },
];

function NavGroup({ label, items }: { label: { fr: string; en: string }; items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <div>
      <div
        style={{
          padding: "0 12px 6px",
          fontSize: 10.5,
          color: "var(--ink-3)",
          fontWeight: 700,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        <T fr={label.fr} en={label.en} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {items.map((it) => {
          const on = pathname?.startsWith(it.href);
          return (
            <Link
              key={it.id}
              href={it.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 12px",
                borderRadius: 8,
                background: on ? "var(--brand-soft)" : "transparent",
                color: on ? "var(--brand-600)" : "var(--ink-2)",
                fontSize: 13,
                fontWeight: on ? 600 : 500,
              }}
            >
              <Icon name={it.icon} size={16} stroke={on ? 2 : 1.7} />
              <span>
                <T fr={it.fr} en={it.en} />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function AdminSidebar({
  userName = "—",
  userRole = "Super Admin",
}: {
  userName?: string;
  userRole?: string;
}) {
  return (
    <div
      style={{
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        padding: "16px 12px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        overflowY: "auto",
        minHeight: 0,
      }}
    >
      <div style={{ padding: "4px 8px 0" }}>
        <Logo size={26} withWord />
        <div
          style={{
            marginTop: 4,
            marginLeft: 36,
            fontSize: 10.5,
            color: "var(--ink-3)",
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          <T fr="Console admin" en="Admin console" />
        </div>
      </div>

      <button
        type="button"
        style={{
          margin: "4px 4px 0",
          padding: "10px 12px",
          borderRadius: 10,
          background: "var(--surface-2)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          border: "1px solid var(--border)",
          cursor: "pointer",
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 7,
            background: "var(--ink)",
            color: "var(--surface)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 11,
          }}
        >
          EK
        </div>
        <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink)" }}>
            E-KLASS <span style={{ color: "var(--ink-3)", fontWeight: 500 }}>·</span> Prod
          </div>
          <div style={{ fontSize: 10.5, color: "var(--ink-3)" }}>e-kelasi.vercel.app</div>
        </div>
        <Icon name="chevD" size={14} style={{ color: "var(--ink-3)" }} />
      </button>

      <NavGroup label={{ fr: "Plateforme", en: "Platform" }} items={NAV} />
      <NavGroup label={{ fr: "Organisation", en: "Organization" }} items={ORG} />

      <div style={{ marginTop: "auto" }}>
        <div style={{ marginTop: 10, padding: "10px 8px", display: "flex", alignItems: "center", gap: 8 }}>
          <Avatar name={userName} size={30} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userName}</div>
            <div style={{ fontSize: 10.5, color: "var(--ink-3)" }}>{userRole}</div>
          </div>
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
