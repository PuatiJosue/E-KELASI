"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";
import { Logo } from "@/components/Logo";
import { Avatar } from "@/components/Avatar";
import { LogoutButton } from "@/components/LogoutButton";
import { T } from "@/lib/i18n";
import type { MySchool, SchoolRequestCounts } from "@/lib/school-db";

type NavItem = { id: string; href: string; icon: string; fr: string; en: string };

const NAV: NavItem[] = [
  { id: "overview", href: "/school/overview", icon: "home",     fr: "Vue d'ensemble", en: "Overview" },
  { id: "requests", href: "/school/requests", icon: "flag",     fr: "Demandes",      en: "Requests" },
  { id: "messages", href: "/school/messages", icon: "chat",     fr: "Messagerie",    en: "Inbox" },
  { id: "announcements", href: "/school/announcements", icon: "bell", fr: "Annonces", en: "Announcements" },
  { id: "inscriptions", href: "/school/inscriptions", icon: "school", fr: "Inscription", en: "Admission" },
  { id: "reenrollments", href: "/school/reenrollments", icon: "refresh", fr: "Réinscription", en: "Re-enrollment" },
  { id: "promotion", href: "/school/promotion", icon: "graduation", fr: "Passage de classe", en: "Class promotion" },
  { id: "staff",    href: "/school/staff",    icon: "user",     fr: "Personnel",     en: "Staff" },
  { id: "attendance", href: "/school/attendance", icon: "clock", fr: "Présence du personnel", en: "Staff attendance" },
  { id: "student-attendance", href: "/school/student-attendance", icon: "calendar", fr: "Présences élèves", en: "Student attendance" },
  { id: "students", href: "/school/students", icon: "book",     fr: "Annuaire des classes", en: "Class directory" },
  { id: "classes",  href: "/school/classes",  icon: "pieChart", fr: "Rapport global de l'école", en: "School report" },
  { id: "parents",  href: "/school/parents",  icon: "users",    fr: "Parents",       en: "Parents" },
  { id: "finances", href: "/school/finances", icon: "dollar",   fr: "Finance",       en: "Finances" },
  { id: "reports",  href: "/school/reports",  icon: "file",     fr: "Bulletins",     en: "Reports" },
  { id: "timetable", href: "/school/timetable", icon: "calendar", fr: "Horaires", en: "Timetable" },
  { id: "videos",   href: "/school/videos",   icon: "bookOpen", fr: "Vidéos des cours", en: "Course videos" },
];

const SEC: NavItem[] = [
  { id: "billing",  href: "/school/billing",  icon: "creditcard", fr: "Abonnement",   en: "Subscription" },
  { id: "branding", href: "/school/branding", icon: "star",     fr: "Branding école", en: "School branding" },
  { id: "settings", href: "/school/settings", icon: "settings", fr: "Paramètres",     en: "Settings" },
];

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      style={{
        marginLeft: "auto",
        minWidth: 18,
        height: 18,
        padding: "0 5px",
        borderRadius: 9,
        background: "var(--danger)",
        color: "#fff",
        fontSize: 10.5,
        fontWeight: 700,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 1,
      }}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

function NavGroup({ label, items, counts }: { label: { fr: string; en: string }; items: NavItem[]; counts?: Record<string, number> }) {
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
              <Badge count={counts?.[it.id] ?? 0} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function SchoolSidebar({ school, userName, counts }: { school: MySchool | null; userName?: string; counts?: SchoolRequestCounts }) {
  const displayName = userName || "Direction";
  const navCounts: Record<string, number> = {
    requests: counts?.requests ?? 0,
    messages: counts?.messages ?? 0,
    inscriptions: counts?.inscriptions ?? 0,
    reenrollments: counts?.reenrollments ?? 0,
  };
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
          <T fr="Direction" en="Direction" />
        </div>
      </div>

      {/* School badge */}
      {school && (
        <div
          style={{
            margin: "4px 4px 0",
            padding: "11px 12px",
            borderRadius: 13,
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              background: school.brandColor ?? "var(--grad-brand)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 12,
              fontFamily: "var(--font-display)",
            }}
          >
            {school.name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("")}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {school.name}
            </div>
            <div style={{ fontSize: 10.5, color: "var(--ink-3)" }}>
              {school.city} · Plan {school.plan === "pro" ? "Pro" : "Standard"}
            </div>
          </div>
        </div>
      )}

      <NavGroup label={{ fr: "École", en: "School" }} items={NAV} counts={navCounts} />
      <NavGroup label={{ fr: "Compte", en: "Account" }} items={SEC} />

      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ padding: "4px 8px", display: "flex", alignItems: "center", gap: 8 }}>
          <Avatar name={displayName} size={30} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</div>
            <div style={{ fontSize: 10.5, color: "var(--ink-3)" }}>Direction</div>
          </div>
        </div>
        <LogoutButton label="Se déconnecter" block />
      </div>
    </div>
  );
}
