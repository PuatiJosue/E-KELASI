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
  { id: "dashboard", href: "/teacher/dashboard", icon: "home",       fr: "Tableau de bord", en: "Dashboard" },
  { id: "classes",   href: "/teacher/classes",   icon: "users",      fr: "Mes classes",     en: "My classes" },
  { id: "attendance",href: "/teacher/attendance",icon: "calendar",   fr: "Présence",        en: "Attendance" },
  { id: "grades",    href: "/teacher/grades",    icon: "chart",      fr: "Saisie notes",    en: "Enter grades" },
  { id: "history",   href: "/teacher/history",   icon: "clock",      fr: "Historique des notes", en: "Grade history" },
  { id: "journal",   href: "/teacher/journal",   icon: "edit",       fr: "Journal de bord", en: "Class logbook" },
  { id: "bulletins", href: "/teacher/bulletins", icon: "file",       fr: "Bulletins",       en: "Report cards" },
  { id: "homework",  href: "/teacher/homework",  icon: "book",       fr: "Devoirs",         en: "Homework" },
];

const SEC: NavItem[] = [
  { id: "profile",  href: "/teacher/profile",  icon: "user",     fr: "Mon profil",  en: "My profile" },
  { id: "settings", href: "/teacher/settings", icon: "settings", fr: "Paramètres",  en: "Settings" },
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
                gap: 11,
                padding: "9px 12px",
                borderRadius: 10,
                background: on ? "var(--brand-soft)" : "transparent",
                color: on ? "var(--brand-600)" : "var(--ink-2)",
                fontSize: 13,
                fontWeight: on ? 600 : 500,
              }}
            >
              <Icon name={it.icon} size={16} stroke={on ? 2 : 1.7} />
              <span><T fr={it.fr} en={it.en} /></span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function TeacherSidebar({ name, avatarUrl }: { name?: string | null; avatarUrl?: string | null }) {
  const displayName = name?.trim() || "Professeur";
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
        overflowX: "hidden",
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
          <T fr="Espace professeur" en="Teacher space" />
        </div>
      </div>

      <NavGroup label={{ fr: "Enseignement", en: "Teaching" }} items={NAV} />
      <NavGroup label={{ fr: "Mon compte", en: "Account" }} items={SEC} />

      <div style={{ marginTop: "auto" }}>
        <div className="ek-card" style={{ padding: 12, background: "var(--accent-50)", border: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="sparkle" size={14} style={{ color: "var(--accent)" }} />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--accent)",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              <T fr="Astuce" en="Tip" />
            </span>
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-2)", marginTop: 6, lineHeight: 1.4 }}>
            <T
              fr="Tu peux saisir plusieurs notes d'un coup depuis Saisir notes."
              en="You can enter multiple grades at once from Enter grades."
            />
          </div>
        </div>

        <div style={{ marginTop: 10, padding: "10px 8px", display: "flex", alignItems: "center", gap: 8 }}>
          <Avatar name={displayName} url={avatarUrl ?? undefined} size={30} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{displayName}</div>
            <div style={{ fontSize: 10.5, color: "var(--ink-3)" }}><T fr="Professeur" en="Teacher" /></div>
          </div>
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
