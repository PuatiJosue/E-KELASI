"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";
import { Logo } from "@/components/Logo";
import { Avatar } from "@/components/Avatar";
import { LogoutButton } from "@/components/LogoutButton";
import { T } from "@/lib/i18n";
import type { MySchool } from "@/lib/school-db";

type NavItem = { id: string; href: string; icon: string; fr: string; en: string };

const NAV: NavItem[] = [
  { id: "overview", href: "/school/overview", icon: "pieChart", fr: "Vue d'ensemble", en: "Overview" },
  { id: "requests", href: "/school/requests", icon: "bell",     fr: "Demandes",      en: "Requests" },
  { id: "announcements", href: "/school/announcements", icon: "bell", fr: "Annonces", en: "Announcements" },
  { id: "reenrollments", href: "/school/reenrollments", icon: "school", fr: "Réinscriptions", en: "Enrollment" },
  { id: "teachers", href: "/school/teachers", icon: "users",    fr: "Professeurs",   en: "Teachers" },
  { id: "staff",    href: "/school/staff",    icon: "user",     fr: "Personnel",     en: "Staff" },
  { id: "courses",  href: "/school/courses",  icon: "file",     fr: "Cours",         en: "Courses" },
  { id: "attendance", href: "/school/attendance", icon: "calendar", fr: "Présences", en: "Attendance" },
  { id: "students", href: "/school/students", icon: "user",     fr: "Élèves",        en: "Students" },
  { id: "classes",  href: "/school/classes",  icon: "pieChart", fr: "Classes",       en: "Classes" },
  { id: "parents",  href: "/school/parents",  icon: "users",    fr: "Parents",       en: "Parents" },
  { id: "finances", href: "/school/finances", icon: "creditcard", fr: "Finances",     en: "Finances" },
  { id: "reports",  href: "/school/reports",  icon: "file",     fr: "Bulletins",     en: "Reports" },
];

const SEC: NavItem[] = [
  { id: "billing",  href: "/school/billing",  icon: "creditcard", fr: "Abonnement",   en: "Subscription" },
  { id: "branding", href: "/school/branding", icon: "star",     fr: "Branding école", en: "School branding" },
  { id: "settings", href: "/school/settings", icon: "settings", fr: "Paramètres",     en: "Settings" },
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
              <span><T fr={it.fr} en={it.en} /></span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function SchoolSidebar({ school, userName }: { school: MySchool | null; userName?: string }) {
  const displayName = userName || "Direction";
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
            padding: "12px",
            borderRadius: 10,
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: school.brandColor ?? "var(--brand)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 11,
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
              {school.city} · {school.plan === "pro" ? "Pro" : "Standard"}
            </div>
          </div>
        </div>
      )}

      <NavGroup label={{ fr: "École", en: "School" }} items={NAV} />
      <NavGroup label={{ fr: "Compte", en: "Account" }} items={SEC} />

      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ padding: "8px", display: "flex", alignItems: "center", gap: 8 }}>
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
