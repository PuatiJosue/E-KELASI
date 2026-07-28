"use client";

// Sidebar minimale du surveillant : une seule rubrique, Présences.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";
import { Logo } from "@/components/Logo";
import { Avatar } from "@/components/Avatar";
import { LogoutButton } from "@/components/LogoutButton";
import { T } from "@/lib/i18n";

export function SurveillantSidebar({
  name,
  avatarUrl,
  schoolName,
}: {
  name?: string | null;
  avatarUrl?: string | null;
  schoolName?: string | null;
}) {
  const pathname = usePathname();
  const href = "/surveillant/presences";
  const on = pathname?.startsWith(href);
  const displayName = name?.trim() || "Surveillant";

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
          <T fr="Espace surveillant" en="Supervisor space" />
        </div>
      </div>

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
          <T fr="Surveillance" en="Supervision" />
        </div>
        <Link
          href={href}
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
          <Icon name="calendar" size={16} stroke={on ? 2 : 1.7} />
          <span><T fr="Présences des élèves" en="Student attendance" /></span>
        </Link>
      </div>

      <div style={{ marginTop: "auto" }}>
        <div className="ek-card" style={{ padding: 12, background: "var(--accent-50)", border: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="sparkle" size={14} style={{ color: "var(--accent)" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              <T fr="Astuce" en="Tip" />
            </span>
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-2)", marginTop: 6, lineHeight: 1.4 }}>
            <T
              fr="Le pointage est enregistré à chaque clic : la direction le voit aussitôt."
              en="Each click is saved right away: the school office sees it immediately."
            />
          </div>
        </div>

        <div style={{ marginTop: 10, padding: "10px 8px", display: "flex", alignItems: "center", gap: 8 }}>
          <Avatar name={displayName} url={avatarUrl ?? undefined} size={30} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {displayName}
            </div>
            <div style={{ fontSize: 10.5, color: "var(--ink-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {schoolName || "Surveillant"}
            </div>
          </div>
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
